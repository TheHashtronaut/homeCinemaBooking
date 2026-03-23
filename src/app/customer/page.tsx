import { BACKEND_URL, backendFetch, getCurrentUserFromBackend } from "@/lib/backendApi";
import { Movie, Showtime } from "@/lib/types";

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function posterLabel(title?: string | null) {
  if (title && title.trim()) return title.trim();
  return "Untitled Movie";
}

export default async function CustomerPage({
  searchParams,
}: {
  searchParams?: { movieId?: string };
}) {
  const user = await getCurrentUserFromBackend();
  const moviesData = await backendFetch("/api/movies");
  const movies: Movie[] = (moviesData?.movies ?? []).slice(0, 30);

  const selectedMovieId = searchParams?.movieId ?? movies[0]?.id;

  const now = new Date();
  // Only show bookable slots: showtimes whose end is not in the past.
  // Backend uses `endsAt >= from`, so setting `from = now` prevents already-ended slots
  // from appearing on this page.
  const from = new Date(now.getTime() - 5 * 60 * 1000); // small safety window
  const to = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const showtimesData = selectedMovieId
    ? await backendFetch(
        `/api/showtimes?movieId=${encodeURIComponent(selectedMovieId)}&from=${encodeURIComponent(
          from.toISOString()
        )}&to=${encodeURIComponent(to.toISOString())}`
      )
    : { showtimes: [] };
  const showtimes: Showtime[] = showtimesData?.showtimes ?? [];

  const showtimesByDate = showtimes.reduce<Record<string, typeof showtimes>>((acc, s) => {
    const key = new Date(s.startsAt).toDateString();
    acc[key] = acc[key] ?? [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <main className="card cardPadding">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="title">Customer</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Browse movies, select a showtime, and request the slot.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <a className="btn" href="/customer/bookings">
            My bookings
          </a>
          {user ? (
            <div className="authPill">
              <div style={{ fontWeight: 750 }}>{user.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {user.role === "admin" ? "Admin" : "Customer"}
              </div>
            </div>
          ) : (
            <a className="btn btnPrimary" href="/auth/login">
              Log in to request
            </a>
          )}
        </div>
      </div>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ margin: "0 0 10px 0", fontSize: 18 }}>Movies</h2>
        {movies.length === 0 ? (
          <div className="muted">No movies yet. Ask admin to add one.</div>
        ) : (
          <div className="gridMovies">
            {movies.map((movie) => {
              const isSelected = movie.id === selectedMovieId;
              return (
                <a
                  key={movie.id}
                  href={`/customer?movieId=${movie.id}`}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    border: isSelected
                      ? "1px solid rgba(125,211,252,0.7)"
                      : "1px solid rgba(255,255,255,0.14)",
                    background: isSelected ? "rgba(125,211,252,0.09)" : "rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="posterFrame" style={{ marginBottom: 10 }}>
                    {movie.posterUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={movie.posterUrl} alt="Movie poster" />
                    ) : (
                      <div className="muted" style={{ fontSize: 13, padding: 10, textAlign: "center" }}>
                        Poster placeholder
                      </div>
                    )}
                  </div>
                  <div style={{ fontWeight: 700 }}>{posterLabel(movie.title)}</div>
                  <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                    {isSelected ? "Selected" : "Tap to view showtimes"}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

      <section style={{ marginTop: 22 }}>
        <h2 style={{ margin: "0 0 10px 0", fontSize: 18 }}>
          Showtimes {selectedMovieId ? "" : "(choose a movie)"}
        </h2>
        {selectedMovieId && showtimes.length === 0 ? (
          <div className="muted">No showtimes in the next 14 days.</div>
        ) : null}

        {Object.keys(showtimesByDate).map((dateKey) => (
          <div key={dateKey} style={{ marginTop: 14 }}>
            <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
              {formatDate(new Date(dateKey))}
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {showtimesByDate[dateKey].map((s) => {
                const remaining = s.remaining ?? Math.max(0, s.capacity - (s.approvedCount ?? 0));
                const isEnded = new Date(s.endsAt).getTime() <= now.getTime();
                const canRequest =
                  Boolean(user && user.role === "customer") && remaining > 0 && !isEnded;
                const bookingReason = !user
                  ? "Log in as customer to request"
                  : user.role !== "customer"
                    ? "Only customers can request bookings"
                    : isEnded
                      ? "This showtime has ended"
                      : remaining <= 0
                        ? "No capacity left"
                        : "";
                return (
                  <div
                    key={s.id}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.14)",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 14,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {formatTime(new Date(s.startsAt))} - {formatTime(new Date(s.endsAt))}
                      </div>
                      <div className="muted" style={{ marginTop: 5, fontSize: 13 }}>
                        Remaining capacity:{" "}
                        <span
                          style={{
                            color:
                              remaining > 0 ? "rgba(125,211,252,0.95)" : "rgba(252,165,165,0.95)",
                          }}
                        >
                          {remaining}
                        </span>{" "}
                        / {s.capacity}
                      </div>
                    </div>

                    <form action={`${BACKEND_URL}/api/bookings`} method="post" style={{ display: "grid", gap: 8 }}>
                      <input type="hidden" name="showtimeId" value={s.id} />
                      <button
                        className="btn btnPrimary"
                        type="submit"
                        disabled={!canRequest}
                        title={bookingReason || "Request booking"}
                      >
                        {canRequest ? "Request booking" : bookingReason}
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

