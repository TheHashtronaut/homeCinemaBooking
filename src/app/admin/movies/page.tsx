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
        Edit movie name, poster URL, and banner/gallery image URL. Customer UI shows placeholders when empty.
      </p>

      <section style={{ marginTop: 18 }}>
        <h2 className="panelTitle" style={{ marginTop: 0 }}>
          Add a movie
        </h2>
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
            <div style={{ gridColumn: "span 2" }}>
              <div className="fieldLabel">Banner / gallery image URL (optional)</div>
              <input name="bannerUrl" className="input" placeholder="https://... (used as banner on movie page)" />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <div className="fieldLabel">Description (optional)</div>
              <textarea name="description" className="textarea input" placeholder="Short description / plot summary" />
            </div>
            <div>
              <div className="fieldLabel">Director (optional)</div>
              <input name="director" className="input" placeholder="e.g. Christopher Nolan" />
            </div>
            <div>
              <div className="fieldLabel">Runtime (optional)</div>
              <input name="runtime" className="input" placeholder="e.g. 2h 10m" />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <div className="fieldLabel">Genre (optional)</div>
              <input name="genre" className="input" placeholder="e.g. Thriller, Sci-Fi" />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <div className="fieldLabel">Rating (optional)</div>
              <input name="rating" className="input" placeholder="e.g. PG-13 / 8.2" />
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
        <h2 className="panelTitle" style={{ marginTop: 0 }}>
          Existing movies
        </h2>
        {movies.length === 0 ? (
          <div className="muted">No movies yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {movies.map((movie) => {
              const displayTitle = movie.title?.trim() ? movie.title : "Untitled Movie";
              return (
                <div
                  key={movie.id}
                  className="card"
                  style={{ padding: 14 }}
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
                        <div style={{ gridColumn: "span 2" }}>
                          <div className="fieldLabel">Banner / gallery image URL</div>
                          <input
                            name="bannerUrl"
                            className="input"
                            defaultValue={movie.bannerUrl ?? ""}
                            placeholder="https://... (used as banner on movie page)"
                          />
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                          <div className="fieldLabel">Description</div>
                          <textarea
                            name="description"
                            className="textarea input"
                            defaultValue={movie.description ?? ""}
                            placeholder="Short description / plot summary"
                          />
                        </div>
                        <div>
                          <div className="fieldLabel">Director</div>
                          <input
                            name="director"
                            className="input"
                            defaultValue={movie.director ?? ""}
                            placeholder="e.g. Christopher Nolan"
                          />
                        </div>
                        <div>
                          <div className="fieldLabel">Runtime</div>
                          <input
                            name="runtime"
                            className="input"
                            defaultValue={movie.runtime ?? ""}
                            placeholder="e.g. 2h 10m"
                          />
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                          <div className="fieldLabel">Genre</div>
                          <input
                            name="genre"
                            className="input"
                            defaultValue={movie.genre ?? ""}
                            placeholder="e.g. Thriller, Sci-Fi"
                          />
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                          <div className="fieldLabel">Rating</div>
                          <input
                            name="rating"
                            className="input"
                            defaultValue={movie.rating ?? ""}
                            placeholder="e.g. PG-13 / 8.2"
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

