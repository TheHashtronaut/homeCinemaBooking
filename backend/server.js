import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { newId, parseLocalDateTime, readDb, updateDb } from "./db.js";

const app = express();
const PORT = Number(process.env.BACKEND_PORT ?? 4000);
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";
const COOKIE_NAME = "hc_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function frontendUrl(pathname, params) {
  const base = FRONTEND_URL.endsWith("/") ? FRONTEND_URL.slice(0, -1) : FRONTEND_URL;
  const url = new URL(pathname.startsWith("/") ? pathname : `/${pathname}`, base);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function redirectToast(res, pathname, toastType, code) {
  return res.redirect(
    frontendUrl(pathname, {
      toast: toastType,
      code,
    })
  );
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

function redirectBack(req, fallback = "/") {
  const referer = req.get("referer");
  try {
    return new URL(referer ?? fallback).toString();
  } catch {
    return `${FRONTEND_URL}${fallback}`;
  }
}

async function getAuthUser(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  const db = await readDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;
  const user = db.users.find((u) => u.id === session.userId);
  return user ?? null;
}

async function requireRole(req, res, role, redirectPath) {
  const user = await getAuthUser(req);
  if (!user) {
    if (redirectPath) return redirectToast(res, redirectPath, "error", "UNAUTHORIZED");
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  if (user.role !== role) {
    if (redirectPath) return redirectToast(res, redirectPath, "error", "FORBIDDEN");
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return user;
}

function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "backend" });
});

app.get("/api/auth/me", async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(200).json({ user: null });
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

app.post("/api/auth/register", async (req, res) => {
  const schema = z.object({
    email: z.string().email().max(200),
    password: z.string().min(6).max(200),
    name: z.string().min(1).max(200),
    adminCode: z.string().optional(),
    next: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return redirectToast(res, "/auth/register", "error", "INVALID_INPUT");

  const db = await readDb();
  if (db.users.some((u) => u.email.toLowerCase() === parsed.data.email.toLowerCase())) {
    return redirectToast(res, "/auth/register", "error", "EMAIL_EXISTS");
  }

  // Security: only allow a single admin account; customers register as `customer` only.
  const role = "customer";
  const now = new Date().toISOString();
  const userId = newId();
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const token = newId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  await updateDb((d) => {
    d.users.push({
      id: userId,
      email: parsed.data.email,
      passwordHash,
      name: parsed.data.name,
      role,
      createdAt: now,
      updatedAt: now,
    });
    d.sessions.push({
      token,
      userId,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });
    return d;
  });

  setSessionCookie(res, token);
  // Ensure redirects always go to the frontend.
  const nextPath = typeof parsed.data.next === "string" && parsed.data.next.trim() ? parsed.data.next.trim() : "/customer";
  return res.redirect(frontendUrl(nextPath));
});

app.post("/api/auth/login", async (req, res) => {
  const schema = z.object({
    email: z.string().min(1).max(200),
    password: z.string().min(1).max(200),
    next: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return redirectToast(res, "/auth/login", "error", "INVALID_INPUT");

  const emailLower = parsed.data.email.toLowerCase();
  let db = await readDb();

  const adminExists = db.users.some((u) => u.role === "admin");
  if (!adminExists && emailLower === "admin" && parsed.data.password === "admin") {
    const now = new Date().toISOString();
    const userId = newId();
    const passwordHash = await bcrypt.hash("admin", 10);
    await updateDb((d) => {
      d.users.push({
        id: userId,
        email: "admin",
        passwordHash,
        name: "Admin",
        role: "admin",
        createdAt: now,
        updatedAt: now,
      });
      return d;
    });
    db = await readDb();
  }

  const user = db.users.find((u) => u.email.toLowerCase() === emailLower);
  if (!user) return redirectToast(res, "/auth/login", "error", "AUTH_INVALID");

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return redirectToast(res, "/auth/login", "error", "AUTH_INVALID");

  // Security requirement: every login invalidates all previous sessions.
  const token = newId();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await updateDb((d) => {
    d.sessions = [];
    d.sessions.push({
      token,
      userId: user.id,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });
    return d;
  });

  setSessionCookie(res, token);
  const roleRedirect = user.role === "admin" ? "/admin" : "/customer";
  // Security/UX: admins always land on the admin dashboard.
  if (user.role === "admin") return res.redirect(frontendUrl(roleRedirect));

  const nextPathCandidate =
    typeof parsed.data.next === "string" && parsed.data.next.trim()
      ? parsed.data.next.trim()
      : roleRedirect;
  return res.redirect(frontendUrl(nextPathCandidate));
});

app.post("/api/auth/logout", async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    await updateDb((d) => {
      d.sessions = d.sessions.filter((s) => s.token !== token);
      return d;
    });
  }
  res.cookie(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res.redirect(frontendUrl("/auth/login"));
});

app.get("/api/movies", async (_req, res) => {
  const db = await readDb();
  const movies = db.movies.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ movies });
});

app.post("/api/admin/movies", async (req, res) => {
  if (!(await requireRole(req, res, "admin", "/admin/movies"))) return;
  const schema = z.object({
    title: z.string().max(500).optional(),
    posterUrl: z.string().max(2000).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return redirectToast(res, "/admin/movies", "error", "INVALID_INPUT");

  await updateDb((d) => {
    const now = new Date().toISOString();
    d.movies.push({
      id: newId(),
      title: parsed.data.title?.trim() ? parsed.data.title.trim() : null,
      posterUrl: parsed.data.posterUrl?.trim() ? parsed.data.posterUrl.trim() : null,
      createdAt: now,
      updatedAt: now,
    });
    return d;
  });
  return res.redirect(frontendUrl("/admin/movies"));
});

app.post("/api/admin/movies/:id", async (req, res) => {
  if (!(await requireRole(req, res, "admin", "/admin/movies"))) return;
  const schema = z.object({
    title: z.string().max(500).optional(),
    posterUrl: z.string().max(2000).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return redirectToast(res, "/admin/movies", "error", "INVALID_INPUT");

  const movieId = req.params.id;
  await updateDb((d) => {
    const m = d.movies.find((x) => x.id === movieId);
    if (!m) return d;
    m.title = parsed.data.title?.trim() ? parsed.data.title.trim() : null;
    m.posterUrl = parsed.data.posterUrl?.trim() ? parsed.data.posterUrl.trim() : null;
    m.updatedAt = new Date().toISOString();
    return d;
  });
  return res.redirect(frontendUrl("/admin/movies"));
});

app.get("/api/showtimes", async (req, res) => {
  const db = await readDb();
  const movieId = typeof req.query.movieId === "string" ? req.query.movieId : undefined;
  const from = typeof req.query.from === "string" ? new Date(req.query.from) : null;
  const to = typeof req.query.to === "string" ? new Date(req.query.to) : null;

  let rows = db.showtimes.slice();
  if (movieId) rows = rows.filter((s) => s.movieId === movieId);
  if (from && !Number.isNaN(from.getTime())) rows = rows.filter((s) => new Date(s.startsAt) >= from);
  if (to && !Number.isNaN(to.getTime())) rows = rows.filter((s) => new Date(s.startsAt) <= to);

  rows.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const showtimes = rows.map((s) => {
    const approvedCount = db.bookingRequests.filter(
      (r) => r.showtimeId === s.id && r.status === "APPROVED"
    ).length;
    return {
      ...s,
      approvedCount,
      remaining: Math.max(0, s.capacity - approvedCount),
    };
  });
  res.json({ showtimes });
});

app.post("/api/admin/showtimes", async (req, res) => {
  if (!(await requireRole(req, res, "admin", "/admin/showtimes"))) return;
  const schema = z.object({
    movieId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return redirectToast(res, "/admin/showtimes", "error", "INVALID_INPUT");

  const startsAt = parseLocalDateTime(parsed.data.date, parsed.data.startTime);
  const endsAt = parseLocalDateTime(parsed.data.date, parsed.data.endTime);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return redirectToast(res, "/admin/showtimes", "error", "INVALID_INPUT");
  }

  await updateDb((d) => {
    const now = new Date().toISOString();
    d.showtimes.push({
      id: newId(),
      movieId: parsed.data.movieId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      capacity: 10,
      createdAt: now,
      updatedAt: now,
    });
    return d;
  });
  return res.redirect(frontendUrl("/admin/showtimes"));
});

app.post("/api/bookings", async (req, res) => {
  const user = await requireRole(req, res, "customer", "/auth/login");
  if (!user) return;
  const schema = z.object({ showtimeId: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return redirectToast(res, "/customer", "error", "INVALID_INPUT");

  const db = await readDb();
  if (!db.showtimes.find((s) => s.id === parsed.data.showtimeId)) {
    return redirectToast(res, "/customer", "error", "NOT_FOUND");
  }

  await updateDb((d) => {
    const now = new Date().toISOString();
    d.bookingRequests.push({
      id: newId(),
      showtimeId: parsed.data.showtimeId,
      customerId: user.id,
      status: "PENDING",
      requestedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return d;
  });
  return res.redirect(frontendUrl("/customer/bookings"));
});

app.get("/api/bookings/me", async (req, res) => {
  const user = await requireRole(req, res, "customer");
  if (!user) return;
  const db = await readDb();
  const bookings = db.bookingRequests
    .filter((b) => b.customerId === user.id)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  res.json({ bookings });
});

app.get("/api/admin/bookings", async (req, res) => {
  if (!(await requireRole(req, res, "admin"))) return;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const db = await readDb();
  let rows = db.bookingRequests.slice();
  if (status) rows = rows.filter((r) => r.status === status);
  rows.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  res.json({ bookings: rows });
});

async function updateBookingStatus(req, res, expectedCurrent, nextStatus, extra = {}) {
  if (!(await requireRole(req, res, "admin", "/auth/login"))) return;
  const bookingId = req.params.id;
  const db = await readDb();
  const booking = db.bookingRequests.find((b) => b.id === bookingId);
  if (!booking) return redirectToast(res, "/admin", "error", "NOT_FOUND");
  if (booking.status !== expectedCurrent) {
    return redirectToast(res, "/admin", "error", "BOOKING_NOT_PENDING");
  }

  if (nextStatus === "APPROVED") {
    const showtime = db.showtimes.find((s) => s.id === booking.showtimeId);
    if (!showtime) return redirectToast(res, "/admin", "error", "NOT_FOUND");
    const approvedCount = db.bookingRequests.filter(
      (r) => r.showtimeId === booking.showtimeId && r.status === "APPROVED"
    ).length;
    if (approvedCount >= showtime.capacity) {
      return redirectToast(res, "/admin", "error", "NO_CAPACITY");
    }
  }

  await updateDb((d) => {
    const target = d.bookingRequests.find((b) => b.id === bookingId);
    if (!target) return d;
    target.status = nextStatus;
    target.updatedAt = new Date().toISOString();
    Object.assign(target, extra);
    return d;
  });
  return res.redirect(frontendUrl("/admin"));
}

app.post("/api/admin/bookings/:id/approve", async (req, res) => {
  const adminNote = typeof req.body.adminNote === "string" ? req.body.adminNote : undefined;
  return updateBookingStatus(req, res, "PENDING", "APPROVED", {
    approvedAt: new Date().toISOString(),
    adminNote,
  });
});

app.post("/api/admin/bookings/:id/reject", async (req, res) => {
  const rejectionReason = typeof req.body.rejectionReason === "string" ? req.body.rejectionReason : undefined;
  return updateBookingStatus(req, res, "PENDING", "REJECTED", {
    rejectedAt: new Date().toISOString(),
    rejectionReason,
  });
});

app.post("/api/admin/bookings/:id/cancel", async (req, res) => {
  const adminNote = typeof req.body.adminNote === "string" ? req.body.adminNote : undefined;
  return updateBookingStatus(req, res, "APPROVED", "CANCELLED", {
    cancelledAt: new Date().toISOString(),
    adminNote,
  });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

