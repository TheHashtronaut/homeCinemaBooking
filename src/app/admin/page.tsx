import { BACKEND_URL, backendFetch, getCurrentUserFromBackend } from "@/lib/backendApi";
import { BookingRequest, Movie, Showtime } from "@/lib/types";

function formatSlot(startsAtIso: string, endsAtIso: string) {
  const d = new Date(startsAtIso);
  const dateStr = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const startStr = new Date(startsAtIso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const endStr = new Date(endsAtIso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return { dateStr, timeRange: `${startStr} - ${endStr}` };
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ movieId?: string; customerId?: string; from?: string; to?: string; sort?: string }> | {
    movieId?: string;
    customerId?: string;
    from?: string;
    to?: string;
    sort?: string;
  };
}) {
  const user = await getCurrentUserFromBackend();
  if (!user || user.role !== "admin") {
    return (
      <main className="card cardPadding">
        <h1 className="title">Admin</h1>
        <p className="muted">Please log in as admin to access this page.</p>
      </main>
    );
  }

  const sp = (searchParams ? await searchParams : undefined) ?? {};
  const movieId = typeof sp.movieId === "string" ? sp.movieId.trim() : "";
  const customerId = typeof sp.customerId === "string" ? sp.customerId.trim() : "";
  const from = typeof sp.from === "string" ? sp.from.trim() : "";
  const to = typeof sp.to === "string" ? sp.to.trim() : "";
  const sort = typeof sp.sort === "string" ? sp.sort.trim() : "";

  const qs = new URLSearchParams();
  if (movieId) qs.set("movieId", movieId);
  if (customerId) qs.set("customerId", customerId);
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  if (sort) qs.set("sort", sort);

  const pendingPath = `/api/admin/bookings?status=PENDING${qs.toString() ? `&${qs.toString()}` : ""}`;
  const approvedPath = `/api/admin/bookings?status=APPROVED${qs.toString() ? `&${qs.toString()}` : ""}`;

  const [pendingData, approvedData, moviesData, showtimesData] = await Promise.all([
    backendFetch(pendingPath),
    backendFetch(approvedPath),
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
        <form method="get" action="/admin" style={{ display: "grid", gap: 12 }}>
          <div className="formGrid">
            <div>
              <div className="fieldLabel">Movie</div>
              <select name="movieId" className="select" defaultValue={movieId}>
                <option value="">All movies</option>
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title?.trim() ? m.title : "Untitled Movie"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="fieldLabel">Sort</div>
              <select name="sort" className="select" defaultValue={sort}>
                <option value="">Newest request</option>
                <option value="requested_asc">Oldest request</option>
                <option value="showtime_asc">Soonest showtime</option>
                <option value="showtime_desc">Latest showtime</option>
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <div className="fieldLabel">Customer ID (optional)</div>
              <input className="input" name="customerId" placeholder="Customer UUID" defaultValue={customerId} />
            </div>
            <div>
              <div className="fieldLabel">From</div>
              <input className="input" type="date" name="from" defaultValue={from} />
            </div>
            <div>
              <div className="fieldLabel">To</div>
              <input className="input" type="date" name="to" defaultValue={to} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn btnPrimary" type="submit">
              Apply
            </button>
            {(movieId || customerId || from || to || sort) && (
              <a className="btn" href="/admin">Reset</a>
            )}
          </div>
        </form>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 className="panelTitle" style={{ marginTop: 0 }}>
          Pending requests
        </h2>
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
                  className="card"
                  style={{ padding: 14 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{movieTitle}</div>
                      <div className="statusChip statusChipPending" style={{ marginTop: 10 }}>
                        Pending
                      </div>
                      <div className="muted" style={{ marginTop: 4 }}>
                        {dateStr} · {timeRange}
                      </div>
                      <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                        Customer: {req.customerId}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 13 }}>
                        Remaining capacity:{" "}
                        <span style={{ color: remaining > 0 ? "rgba(var(--accent-rgb),0.95)" : "rgba(255,255,255,0.72)" }}>
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
                        <input
                          className="actionLink actionLinkPrimary"
                          type="submit"
                          value="Approve"
                          disabled={remaining <= 0}
                          title={remaining <= 0 ? "No capacity left for this showtime" : "Approve booking"}
                          style={{ justifySelf: "start" }}
                        />
                      </form>

                      <form action={`${BACKEND_URL}/api/admin/bookings/${req.id}/reject`} method="post" style={{ display: "grid", gap: 8 }}>
                        <input
                          type="text"
                          name="rejectionReason"
                          className="input"
                          placeholder="Rejection reason (optional)"
                        />
                        <input
                          className="actionLink actionLinkDanger"
                          type="submit"
                          value="Reject"
                          style={{ justifySelf: "start" }}
                        />
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
        <h2 className="panelTitle" style={{ marginTop: 0 }}>
          Approved bookings (admin can cancel)
        </h2>
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
                  className="card"
                  style={{ padding: 14 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{movieTitle}</div>
                      <div className="statusChip statusChipApproved" style={{ marginTop: 10 }}>
                        Approved
                      </div>
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
                      <input
                        className="actionLink actionLinkDanger"
                        type="submit"
                        value="Cancel booking"
                        style={{ justifySelf: "start" }}
                      />
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
