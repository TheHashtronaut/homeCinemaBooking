import { BACKEND_URL, backendFetch, getCurrentUserFromBackend } from "@/lib/backendApi";
import { Movie, Showtime } from "@/lib/types";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default async function AdminShowtimesPage() {
  const user = await getCurrentUserFromBackend();
  if (!user || user.role !== "admin") {
    return (
      <main className="card cardPadding">
        <h1 className="title">Manage Showtimes</h1>
        <p className="muted">Please log in as admin.</p>
      </main>
    );
  }
  const [moviesData, showtimesData] = await Promise.all([
    backendFetch("/api/movies"),
    backendFetch("/api/showtimes"),
  ]);
  const movies: Movie[] = moviesData?.movies ?? [];
  const showtimes: Showtime[] = (showtimesData?.showtimes ?? []).slice(0, 50);
  const movieById = new Map(movies.map((m) => [m.id, m]));

  return (
    <main className="card cardPadding">
      <h1 className="title">Manage Showtimes</h1>
      <p className="muted" style={{ marginTop: 6 }}>
        Add a calendar slot (date + start time + end time). Capacity is max 10 per slot.
      </p>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ margin: "0 0 10px 0", fontSize: 18 }}>Add a showtime</h2>
        {movies.length === 0 ? (
          <div className="muted">Create a movie first.</div>
        ) : (
          <form action={`${BACKEND_URL}/api/admin/showtimes`} method="post" className="card" style={{ padding: 14 }}>
            <div className="formGrid">
              <div>
                <div className="fieldLabel">Movie</div>
                <select name="movieId" className="select" defaultValue={movies[0]?.id}>
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title?.trim() ? m.title : "Untitled Movie"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="fieldLabel">Date</div>
                <input name="date" className="input" type="date" required />
              </div>
            </div>

            <div className="formGrid" style={{ marginTop: 14 }}>
              <div>
                <div className="fieldLabel">Start time</div>
                <input name="startTime" className="input" type="time" required />
              </div>
              <div>
                <div className="fieldLabel">End time</div>
                <input name="endTime" className="input" type="time" required />
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn btnPrimary" type="submit">
                Add showtime
              </button>
              <a className="btn" href="/admin">
                Back to dashboard
              </a>
            </div>
          </form>
        )}
      </section>

      <section style={{ marginTop: 22 }}>
        <h2 style={{ margin: "0 0 10px 0", fontSize: 18 }}>Existing showtimes</h2>
        {showtimes.length === 0 ? (
          <div className="muted">No showtimes yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {showtimes.map((s) => {
              const remaining = s.remaining ?? Math.max(0, s.capacity - (s.approvedCount ?? 0));
              const movie = movieById.get(s.movieId);
              return (
                <div
                  key={s.id}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.14)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{movie?.title?.trim() ? movie.title : "Untitled Movie"}</div>
                    <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                      {formatDate(s.startsAt)} · {formatTime(s.startsAt)} - {formatTime(s.endsAt)}
                    </div>
                    <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                      Remaining capacity:{" "}
                      <span style={{ color: remaining > 0 ? "rgba(125,211,252,0.95)" : "rgba(252,165,165,0.95)" }}>
                        {remaining}
                      </span>{" "}
                      / {s.capacity}
                    </div>
                  </div>

                  <div style={{ display: "grid", justifyItems: "end", gap: 10, alignSelf: "center" }}>
                    <form action={`${BACKEND_URL}/api/admin/showtimes/${s.id}/delete`} method="post">
                      <button className="btn btnDanger" type="submit" title="Delete this showtime permanently">
                        Delete
                      </button>
                    </form>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {s.id.slice(0, 10)}…
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

