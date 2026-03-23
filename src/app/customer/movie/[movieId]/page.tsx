import { BACKEND_URL, backendFetch, getCurrentUserFromBackend } from "@/lib/backendApi";
import { Movie, Showtime } from "@/lib/types";
import type { CSSProperties } from "react";

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default async function CustomerMoviePage({
  params,
}: {
  params: { movieId: string } | Promise<{ movieId: string }>;
}) {
  const resolvedParams = await params;
  const user = await getCurrentUserFromBackend();

  const [moviesData, showtimesData] = await Promise.all([
    backendFetch("/api/movies"),
    backendFetch(`/api/showtimes?movieId=${encodeURIComponent(resolvedParams.movieId)}&from=${encodeURIComponent(
      new Date(Date.now() - 5 * 60 * 1000).toISOString()
    )}&to=${encodeURIComponent(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())}`),
  ]);

  const movies: Movie[] = moviesData?.movies ?? [];
  const movie = movies.find((m) => m.id === resolvedParams.movieId);
  const showtimes: Showtime[] = showtimesData?.showtimes ?? [];

  const showtimesByDate = showtimes.reduce<Record<string, Showtime[]>>((acc, s) => {
    const key = new Date(s.startsAt).toDateString();
    acc[key] = acc[key] ?? [];
    acc[key].push(s);
    return acc;
  }, {});

  const now = new Date();
  // Mapping requirement:
  // - poster = first image admins adds (posterUrl)
  // - banner = second image admins adds (bannerUrl / gallery)
  const bannerUrl = movie?.bannerUrl ?? null;
  const posterUrl = movie?.posterUrl ?? null;

  return (
    <main className="card cardPadding">
      <div className="movieDetailHero">
        <div
          className="movieDetailBanner"
          style={{
            backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
          }}
        >
          <div className="movieDetailBannerOverlay" />
        </div>

        <div className="movieDetailHeroInner">
          <a className="btn" href="/customer" style={{ alignSelf: "flex-start" }}>
            Back to movies
          </a>

          <div className="movieDetailHeaderRow">
            <div className="posterFrame movieDetailPoster">
              {posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={posterUrl} alt="Movie poster" />
              ) : (
                <div className="muted" style={{ fontSize: 13, padding: 10, textAlign: "center" }}>
                  Poster placeholder
                </div>
              )}
            </div>

            <div style={{ flex: 1, paddingTop: 6 }}>
              <h1 className="title" style={{ marginBottom: 6 }}>
                {movie?.title?.trim() ? movie.title : "Untitled Movie"}
              </h1>

              <div className="movieDetailMetaRow">
                {movie?.runtime ? (
                  <div className="movieDetailMetaItem">
                    <div className="movieDetailMetaLabel">Runtime</div>
                    <div className="movieDetailMetaValue">{movie.runtime}</div>
                  </div>
                ) : null}

                {movie?.director ? (
                  <div className="movieDetailMetaItem">
                    <div className="movieDetailMetaLabel">Director</div>
                    <div className="movieDetailMetaValue">{movie.director}</div>
                  </div>
                ) : null}

                {movie?.genre ? (
                  <div className="movieDetailMetaItem">
                    <div className="movieDetailMetaLabel">Genre</div>
                    <div className="movieDetailMetaValue">{movie.genre}</div>
                  </div>
                ) : null}

                {movie?.rating ? (
                  <div className="movieDetailMetaItem">
                    <div className="movieDetailMetaLabel">Rating</div>
                    <div className="movieDetailMetaValue">{movie.rating}</div>
                  </div>
                ) : null}
              </div>

              {movie?.description ? (
                <p className="movieDetailDescription">{movie.description}</p>
              ) : (
                <div className="muted" style={{ fontSize: 13, lineHeight: 1.5, marginTop: 10 }}>
                  Requests go to admin for approval. Capacity max 10 per showtime.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <section style={{ marginTop: 22 }}>
        <h2 className="panelTitle" style={{ marginTop: 0 }}>
          Showtimes
        </h2>

        {showtimes.length === 0 ? (
          <div className="muted">No showtimes in the next 14 days.</div>
        ) : (
          <div className="movieDetailShowtimes">
            {Object.keys(showtimesByDate).map((dateKey) => (
              <div key={dateKey} className="movieDetailDateBlock">
                <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
                  {formatDate(new Date(dateKey))}
                </div>

                <div className="movieDetailShowtimeList">
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

                    const start = new Date(s.startsAt);
                    const end = new Date(s.endsAt);
                    const timeRange = `${formatTime(start)} - ${formatTime(end)}`;

                    const cardStyle: CSSProperties = {
                      padding: 14,
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(255,255,255,0.02)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      alignItems: "flex-start",
                    };

                    if (canRequest) {
                      return (
                        <form
                          key={s.id}
                          action={`${BACKEND_URL}/api/bookings`}
                          method="post"
                          className="showtimeCardForm"
                        >
                          <input type="hidden" name="showtimeId" value={s.id} />
                          <div className="showtimeCardInner" style={cardStyle}>
                            <button type="submit" className="sessionTimeButton">
                              {timeRange}
                            </button>

                            <div className="muted" style={{ fontSize: 13 }}>
                              Remaining capacity:{" "}
                              <span
                                style={{
                                  color: remaining > 0 ? "rgba(var(--accent-rgb),0.95)" : "rgba(255,255,255,0.7)",
                                  fontWeight: 900,
                                }}
                              >
                                {remaining}
                              </span>{" "}
                              / {s.capacity}
                            </div>
                          </div>
                        </form>
                      );
                    }

                    return (
                      <div key={s.id} className="showtimeCardInner" style={cardStyle}>
                        <div className="sessionTimeButton sessionTimeButtonDisabled" aria-disabled="true">
                          {timeRange}
                        </div>

                        <div className="muted" style={{ fontSize: 13 }}>
                          Remaining capacity:{" "}
                          <span
                            style={{
                              color: remaining > 0 ? "rgba(var(--accent-rgb),0.95)" : "rgba(255,255,255,0.7)",
                              fontWeight: 900,
                            }}
                          >
                            {remaining}
                          </span>{" "}
                          / {s.capacity}
                        </div>

                        {bookingReason ? (
                          <div className="muted" style={{ fontSize: 13 }}>
                            {bookingReason}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

