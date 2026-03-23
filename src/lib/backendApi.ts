import { headers } from "next/headers";

export const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:4000";

async function forwardCookieHeader() {
  const h = await headers();
  return h.get("cookie") ?? "";
}

export async function backendFetch(path: string, init?: RequestInit) {
  const cookie = await forwardCookieHeader();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      cookie,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export async function getCurrentUserFromBackend() {
  const data = await backendFetch("/api/auth/me");
  return data?.user ?? null;
}

