import { backendFetch, getCurrentUserFromBackend } from "@/lib/backendApi";
import { Movie } from "@/lib/types";
import HighlightLastViewedMovie from "@/app/components/HighlightLastViewedMovie";

function posterLabel(title?: string | null) {
  if (title && title.trim()) return title.trim();
  return "Untitled Movie";
}

export default async function CustomerPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; sort?: string }> | { q?: string; sort?: string };
}) {
  const user = await getCurrentUserFromBackend();
  const sp = (searchParams ? await searchParams : undefined) ?? {};
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const sort = typeof sp.sort === "string" ? sp.sort.trim() : "";

  const moviesData = await backendFetch(
    `/api/movies${q ? `?q=${encodeURIComponent(q)}${sort ? `&sort=${encodeURIComponent(sort)}` : ""}` : sort ? `?sort=${encodeURIComponent(sort)}` : ""}`
  );
  const movies: Movie[] = (moviesData?.movies ?? []).slice(0, 30);

  return (
    <main className="card cardPadding">
      <HighlightLastViewedMovie />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="title">Customer</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Pick a movie and request showtimes.
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
        <form
          method="get"
          action="/customer"
          style={{ marginTop: 2, display: "grid", gridTemplateColumns: "1fr 200px 130px", gap: 12 }}
        >
          <div>
            <div className="fieldLabel" style={{ marginBottom: 6 }}>
              Search movies
            </div>
            <input className="input" name="q" placeholder="e.g. Inception" defaultValue={q || ""} />
          </div>
          <div>
            <div className="fieldLabel" style={{ marginBottom: 6 }}>
              Sort
            </div>
            <select className="select input" name="sort" defaultValue={sort || ""}>
              <option value="">Newest</option>
              <option value="title_asc">Title A-Z</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
            <button className="btn btnPrimary" type="submit" style={{ width: "100%" }}>
              Search
            </button>
            {(q || sort) && (
              <a className="btn" href="/customer" style={{ width: "100%" }}>
                Clear
              </a>
            )}
          </div>
        </form>

        <h2 className="panelTitle">Movies</h2>
        {movies.length === 0 ? (
          <div className="muted">
            {q ? (
              <>
                No movies match <b>{q}</b>.{" "}
                <a href="/customer" style={{ textDecoration: "underline" }}>
                  Clear search
                </a>
                .
              </>
            ) : (
              <>No movies yet. Ask admin to add one.</>
            )}
          </div>
        ) : (
          <div className="gridMovies">
            {movies.map((movie) => (
              <a
                key={movie.id}
                href={`/customer/movie/${movie.id}`}
                className="card"
                style={{ padding: 14, display: "grid", gap: 12, height: "100%" }}
                data-movie-card={movie.id}
              >
                <div
                  className="posterFrame"
                  style={{
                    aspectRatio: "2 / 3",
                    width: "100%",
                    borderStyle: "solid",
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0, 0, 0, 0.16)",
                  }}
                >
                  {movie.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={movie.posterUrl} alt="Movie poster" />
                  ) : (
                    <div className="muted" style={{ fontSize: 13, padding: 10, textAlign: "center" }}>
                      Poster placeholder
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>{posterLabel(movie.title)}</div>
                </div>

                {/* Small "gallery" preview of the banner image */}
                <div className="muted" style={{ fontSize: 12, display: "grid", gap: 8 }}>
                  <div style={{ color: "rgba(255,255,255,0.75)", fontWeight: 850, textTransform: "uppercase", fontSize: 11 }}>
                    Gallery
                  </div>
                  <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
                    <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", overflow: "hidden" }}>
                      {movie.bannerUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={movie.bannerUrl}
                          alt="Movie gallery image"
                          style={{ width: "100%", height: 48, objectFit: "cover", display: "block" }}
                        />
                      ) : (
                        <div style={{ padding: 8, textAlign: "center", color: "rgba(255,255,255,0.6)" }}>—</div>
                      )}
                    </div>
                    <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", overflow: "hidden" }}>
                      {movie.posterUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={movie.posterUrl}
                          alt="Movie poster thumbnail"
                          style={{ width: "100%", height: 48, objectFit: "cover", display: "block" }}
                        />
                      ) : (
                        <div style={{ padding: 8, textAlign: "center", color: "rgba(255,255,255,0.6)" }}>—</div>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

