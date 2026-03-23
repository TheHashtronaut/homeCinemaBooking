import Link from "next/link";

import { BACKEND_URL, backendFetch } from "@/lib/backendApi";
import { Movie, Showtime } from "@/lib/types";
import HeroBackgroundRotator from "@/app/components/HeroBackgroundRotator";

function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default async function HomePage() {
  const moviesData = await backendFetch("/api/movies");
  const showtimesData = await backendFetch("/api/showtimes");
  const db: { movies: Movie[]; showtimes: Showtime[] } = {
    movies: moviesData?.movies ?? [],
    showtimes: showtimesData?.showtimes ?? [],
  };
  const now = new Date();
  const to = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const upcoming = db.showtimes
    .filter((s) => {
      const start = new Date(s.startsAt);
      return start >= now && start <= to;
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 6);

  const movieById = new Map(db.movies.map((m) => [m.id, m]));

  const heroImages = db.movies
    .map((m) => (m.bannerUrl ?? m.posterUrl ?? null) as string | null)
    .filter((u): u is string => Boolean(u));

  return (
    <main>
      <section className="hero">
        <div className="cinemaHero">
          <HeroBackgroundRotator images={heroImages} intervalMs={5500} />

          <div className="heroBanner">
            <div className="heroOverlay" />

            <div className="heroInner" style={{ position: "relative" }}>
              <div style={{ paddingTop: 14, paddingLeft: 8, paddingRight: 10 }}>
                <h1 className="heroTitle">The Hastronema</h1>
                <p className="muted" style={{ margin: "10px 0 0 0", lineHeight: 1.6, maxWidth: 620 }}>
                  Pick a movie and a calendar slot. Requests go to the admin dashboard and are approved up to capacity
                  (10 per showtime).
                </p>
                <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
                  <Link className="btn btnPrimary" href="/customer">
                    Browse movies & times
                  </Link>
                  <Link className="btn" href="/admin">
                    Admin dashboard
                  </Link>
                </div>
              </div>

              <div className="heroSide card" style={{ padding: 16, position: "relative" }}>
                <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>Upcoming slots</div>
                <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                  Next 14 days
                </div>
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  {upcoming.length === 0 ? (
                    <div className="muted">No showtimes created yet. Ask admin to add some.</div>
                  ) : (
                    upcoming.map((s) => {
                      const movie = movieById.get(s.movieId);
                      const start = new Date(s.startsAt);
                      const end = new Date(s.endsAt);
                      return (
                        <form
                          key={s.id}
                          action={`${BACKEND_URL}/api/bookings`}
                          method="post"
                          className="showtimeCardForm"
                        >
                          <input type="hidden" name="showtimeId" value={s.id} />
                          <input
                            type="submit"
                            className="showtimeCardSubmitOverlay"
                            aria-label="Request booking"
                          />
                          <div
                            className="showtimeCardInner"
                            style={{
                              padding: 12,
                              border: "1px solid rgba(255,255,255,0.12)",
                              borderRadius: 16,
                              background: "rgba(255,255,255,0.03)",
                              display: "grid",
                              gap: 7,
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                              <div style={{ fontWeight: 850 }}>{movie?.title?.trim() ? movie.title : "Untitled Movie"}</div>
                              <div className="sessionTimeButton" style={{ cursor: "default", padding: "8px 12px" }}>
                                {formatTime(start)} - {formatTime(end)}
                              </div>
                            </div>
                            <div className="muted" style={{ fontSize: 12 }}>
                              {start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                            </div>
                          </div>
                        </form>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 22 }}>
        <div className="card cardPadding">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 850, fontSize: 18, letterSpacing: "-0.02em" }}>Movies</div>
              <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                Tap a movie to view showtimes.
              </div>
            </div>
          </div>

          <div className="movieGalleryRail" style={{ marginTop: 14 }}>
            {db.movies.length === 0 ? (
              <div className="muted">No movies yet.</div>
            ) : (
              db.movies.slice(0, 14).map((m) => (
                <Link key={m.id} href={`/customer/movie/${m.id}`} className="movieGalleryCard">
                  <div className="movieGalleryPoster">
                    {m.posterUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.posterUrl} alt={`${m.title ?? "Movie"} poster`} />
                    ) : (
                      <div className="muted" style={{ padding: 8, fontSize: 12, textAlign: "center" }}>
                        Poster placeholder
                      </div>
                    )}
                  </div>
                  <div style={{ fontWeight: 850, fontSize: 13, marginTop: 10 }}>
                    {m.title?.trim() ? m.title : "Untitled Movie"}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <div className="card cardPadding">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ maxWidth: 620 }}>
              <div style={{ fontWeight: 850, fontSize: 18, letterSpacing: "-0.02em" }}>How it works</div>
              <div className="muted" style={{ marginTop: 8, lineHeight: 1.7 }}>
                1) Admin creates showtimes as calendar slots (date + start/end).
                <br />
                2) Customers request the slot.
                <br />
                3) Admin approves requests until capacity reaches 10.
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
              <Link className="btn" href="/customer">
                Request a booking
              </Link>
              <Link className="btn" href="/admin">
                Approve requests
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

