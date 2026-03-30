import { BACKEND_URL, backendFetch, getCurrentUserFromBackend } from "@/lib/backendApi";
import { BookingRequest, Movie, Showtime } from "@/lib/types";

function statusLabel(status: string) {
  if (status === "PENDING") return { text: "Pending", chipClass: "statusChipPending" };
  if (status === "APPROVED") return { text: "Approved", chipClass: "statusChipApproved" };
  if (status === "REJECTED") return { text: "Rejected", chipClass: "statusChipRejected" };
  if (status === "CANCELLED") return { text: "Cancelled", chipClass: "statusChipCancelled" };
  return { text: status, chipClass: "" };
}

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default async function MyBookingsPage() {
  const user = await getCurrentUserFromBackend();
  const customerId = user?.id ?? "";

  const [moviesData, showtimesData, bookingsData] = await Promise.all([
    backendFetch("/api/movies"),
    backendFetch("/api/showtimes"),
    customerId ? backendFetch("/api/bookings/me") : Promise.resolve(null),
  ]);
  const movies = (moviesData?.movies ?? []) as Movie[];
  const showtimes = (showtimesData?.showtimes ?? []) as Showtime[];
  const movieById = new Map(movies.map((m) => [m.id, m]));
  const showtimeById = new Map(showtimes.map((s) => [s.id, s]));

  const bookings: BookingRequest[] = customerId ? bookingsData?.bookings ?? [] : [];

  return (
    <main className="card cardPadding">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="title">My bookings</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Track the approval status of your requested slots.
          </p>
        </div>
        <a className="btn" href="/customer">
          Back to browsing
        </a>
      </div>

      <section style={{ marginTop: 18 }}>
        {!customerId ? (
          <div className="muted">
            Please <a href="/auth/login">log in</a> to view your booking history.
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div className="muted">No booking requests yet.</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a className="btn btnPrimary" href="/customer">
                Browse movies & times
              </a>
              <a className="btn" href="/customer">
                Request your first slot
              </a>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {bookings.map((b) => {
              const st = statusLabel(b.status);
              const showtime = showtimeById.get(b.showtimeId);
              const movie = showtime ? movieById.get(showtime.movieId) : undefined;
              const movieTitle = movie?.title?.trim() ? movie.title : "Untitled Movie";

              return (
                <div
                  key={b.id}
                  className="card"
                  style={{ padding: 14 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{movieTitle}</div>
                      {showtime ? (
                        <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                          {formatDate(new Date(showtime.startsAt))} · {formatTime(new Date(showtime.startsAt))} -{" "}
                          {formatTime(new Date(showtime.endsAt))}
                        </div>
                      ) : (
                        <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                          Unknown showtime
                        </div>
                      )}
                      <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                        Requested: {new Date(b.requestedAt).toLocaleString()}
                      </div>
                      {b.rejectionReason ? (
                        <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                          Rejection reason: {b.rejectionReason}
                        </div>
                      ) : null}
                      {b.adminNote ? (
                        <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                          Admin note: {b.adminNote}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ minWidth: 140 }}>
                      <div className={`statusChip ${st.chipClass}`}>{st.text}</div>
                      <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                        ID: {b.id.slice(0, 10)}…
                      </div>

                      {b.status === "PENDING" ? (
                        <form action={`${BACKEND_URL}/api/bookings/${b.id}/cancel`} method="post" style={{ marginTop: 12 }}>
                          <button className="btn btnDanger" type="submit" style={{ width: "100%" }}>
                            Cancel request
                          </button>
                        </form>
                      ) : null}
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

