import Link from "next/link";

import { backendFetch } from "@/lib/backendApi";
import { Movie, Showtime } from "@/lib/types";

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

  return (
    <main>
      <section className="hero">
        <div className="heroInner">
          <div>
            <h1 className="heroTitle">Home Cinema Booking</h1>
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

          <div className="heroSide card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>Upcoming slots</div>
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
                    <div key={s.id} style={{ padding: 12, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14 }}>
                      <div style={{ fontWeight: 750 }}>{movie?.title?.trim() ? movie.title : "Untitled Movie"}</div>
                      <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                        {start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} ·{" "}
                        {formatTime(start)} - {formatTime(end)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
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

