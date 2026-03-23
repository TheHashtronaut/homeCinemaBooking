import { BACKEND_URL, backendFetch, getCurrentUserFromBackend } from "@/lib/backendApi";
import { Movie } from "@/lib/types";

function MoviePoster({ posterUrl }: { posterUrl?: string | null }) {
  if (!posterUrl) {
    return (
      <div className="posterFrame" style={{ alignItems: "center" }}>
        <div className="muted" style={{ fontSize: 13, padding: 10, textAlign: "center" }}>
          Poster placeholder
        </div>
      </div>
    );
  }

  return (
    <div className="posterFrame">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={posterUrl} alt="Movie poster" />
    </div>
  );
}

export default async function AdminMoviesPage() {
  const user = await getCurrentUserFromBackend();
  if (!user || user.role !== "admin") {
    return (
      <main className="card cardPadding">
        <h1 className="title">Manage Movies</h1>
        <p className="muted">Please log in as admin.</p>
      </main>
    );
  }
  const data = await backendFetch("/api/movies");
  const movies: Movie[] = data?.movies ?? [];

  return (
    <main className="card cardPadding">
      <h1 className="title">Manage Movies</h1>
      <p className="muted" style={{ marginTop: 6 }}>
        Edit movie name and poster URL. Customer UI shows placeholders when empty.
      </p>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ margin: "0 0 10px 0", fontSize: 18 }}>Add a movie</h2>
        <form action={`${BACKEND_URL}/api/admin/movies`} method="post" className="card" style={{ padding: 14 }}>
          <div className="formGrid">
            <div>
              <div className="fieldLabel">Movie name (optional)</div>
              <input name="title" className="input" placeholder="e.g. Inception" />
            </div>
            <div>
              <div className="fieldLabel">Poster URL (optional)</div>
              <input name="posterUrl" className="input" placeholder="https://..." />
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn btnPrimary" type="submit">
              Add movie
            </button>
            <a className="btn" href="/admin">
              Back to dashboard
            </a>
          </div>
        </form>
      </section>

      <section style={{ marginTop: 22 }}>
        <h2 style={{ margin: "0 0 10px 0", fontSize: 18 }}>Existing movies</h2>
        {movies.length === 0 ? (
          <div className="muted">No movies yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {movies.map((movie) => {
              const displayTitle = movie.title?.trim() ? movie.title : "Untitled Movie";
              return (
                <div
                  key={movie.id}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.14)",
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 14, alignItems: "start" }}>
                    <MoviePoster posterUrl={movie.posterUrl} />

                    <form action={`${BACKEND_URL}/api/admin/movies/${movie.id}`} method="post">
                      <div className="formGrid">
                        <div>
                          <div className="fieldLabel">Movie name</div>
                          <input
                            name="title"
                            className="input"
                            defaultValue={movie.title ?? ""}
                            placeholder={displayTitle}
                          />
                        </div>
                        <div>
                          <div className="fieldLabel">Poster URL</div>
                          <input
                            name="posterUrl"
                            className="input"
                            defaultValue={movie.posterUrl ?? ""}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <button className="btn btnPrimary" type="submit">
                          Save changes
                        </button>
                      </div>
                    </form>
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

