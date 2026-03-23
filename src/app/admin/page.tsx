import { BACKEND_URL, backendFetch, getCurrentUserFromBackend } from "@/lib/backendApi";
import { BookingRequest, Movie, Showtime } from "@/lib/types";

function formatSlot(startsAtIso: string, endsAtIso: string) {
  const d = new Date(startsAtIso);
  const dateStr = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const startStr = new Date(startsAtIso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const endStr = new Date(endsAtIso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return { dateStr, timeRange: `${startStr} - ${endStr}` };
}

export default async function AdminDashboardPage() {
  const user = await getCurrentUserFromBackend();
  if (!user || user.role !== "admin") {
    return (
      <main className="card cardPadding">
        <h1 className="title">Admin</h1>
        <p className="muted">Please log in as admin to access this page.</p>
      </main>
    );
  }
  const [pendingData, approvedData, moviesData, showtimesData] = await Promise.all([
    backendFetch("/api/admin/bookings?status=PENDING"),
    backendFetch("/api/admin/bookings?status=APPROVED"),
    backendFetch("/api/movies"),
    backendFetch("/api/showtimes"),
  ]);
  const pending: BookingRequest[] = pendingData?.bookings ?? [];
  const approved: BookingRequest[] = approvedData?.bookings ?? [];
  const movies: Movie[] = moviesData?.movies ?? [];
  const showtimes: Showtime[] = showtimesData?.showtimes ?? [];
  const showtimeById = new Map(showtimes.map((s) => [s.id, s]));
  const movieById = new Map(movies.map((m) => [m.id, m]));

  return (
    <main className="card cardPadding">
      <h1 className="title">Admin Dashboard</h1>
      <p className="muted" style={{ marginTop: 6 }}>
        Approve requests (capacity max 10 per showtime). Overlaps are admin-decided.
      </p>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ margin: "0 0 10px 0", fontSize: 18 }}>Pending requests</h2>
        {pending.length === 0 ? (
          <div className="muted">No pending approvals.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {pending.map((req) => {
              const showtime = showtimeById.get(req.showtimeId);
              const movie = showtime ? movieById.get(showtime.movieId) : undefined;
              const movieTitle = movie?.title?.trim() ? movie.title : "Untitled Movie";
              const { dateStr, timeRange } = showtime
                ? formatSlot(showtime.startsAt, showtime.endsAt)
                : { dateStr: "Unknown date", timeRange: "Unknown time" };
              const remaining = showtime ? (showtime.remaining ?? 0) : 0;

              return (
                <div
                  key={req.id}
                  style={{ padding: 14, borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{movieTitle}</div>
                      <div className="muted" style={{ marginTop: 4 }}>
                        {dateStr} · {timeRange}
                      </div>
                      <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                        Customer: {req.customerId}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 13 }}>
                        Remaining capacity:{" "}
                        <span style={{ color: remaining > 0 ? "rgba(125,211,252,0.95)" : "rgba(252,165,165,0.95)" }}>
                          {remaining}
                        </span>{" "}
                        / {showtime?.capacity ?? 10}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                      <form
                        action={`${BACKEND_URL}/api/admin/bookings/${req.id}/approve`}
                        method="post"
                        style={{ display: "grid", gap: 8 }}
                      >
                        <input type="text" name="adminNote" className="input" placeholder="Admin note (optional)" />
                        <button
                          className="btn btnPrimary"
                          type="submit"
                          disabled={remaining <= 0}
                          title={remaining <= 0 ? "No capacity left for this showtime" : "Approve booking"}
                        >
                          Approve
                        </button>
                      </form>

                      <form action={`${BACKEND_URL}/api/admin/bookings/${req.id}/reject`} method="post" style={{ display: "grid", gap: 8 }}>
                        <input
                          type="text"
                          name="rejectionReason"
                          className="input"
                          placeholder="Rejection reason (optional)"
                        />
                        <button className="btn" type="submit">
                          Reject
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section style={{ marginTop: 22 }}>
        <h2 style={{ margin: "0 0 10px 0", fontSize: 18 }}>Approved bookings (admin can cancel)</h2>
        {approved.length === 0 ? (
          <div className="muted">No approved bookings yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {approved.map((booking) => {
              const showtime = showtimeById.get(booking.showtimeId);
              const movie = showtime ? movieById.get(showtime.movieId) : undefined;
              const movieTitle = movie?.title?.trim() ? movie.title : "Untitled Movie";
              const { dateStr, timeRange } = showtime
                ? formatSlot(showtime.startsAt, showtime.endsAt)
                : { dateStr: "Unknown date", timeRange: "Unknown time" };

              return (
                <div
                  key={booking.id}
                  style={{ padding: 14, borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{movieTitle}</div>
                      <div className="muted" style={{ marginTop: 4 }}>
                        {dateStr} · {timeRange}
                      </div>
                      <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                        Customer: {booking.customerId}
                      </div>
                    </div>

                    <form
                      action={`${BACKEND_URL}/api/admin/bookings/${booking.id}/cancel`}
                      method="post"
                      style={{ display: "grid", gap: 8, alignSelf: "flex-start" }}
                    >
                      <input type="text" name="adminNote" className="input" placeholder="Cancel note (optional)" />
                      <button className="btn btnDanger" type="submit">
                        Cancel booking
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a className="btn" href="/admin/movies">
          Manage movies
        </a>
        <a className="btn" href="/admin/showtimes">
          Manage showtimes
        </a>
      </div>
    </main>
  );
}

