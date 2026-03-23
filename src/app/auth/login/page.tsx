import Link from "next/link";

import { BACKEND_URL, getCurrentUserFromBackend } from "@/lib/backendApi";

export default async function LoginPage({
  searchParams,
}: {
  // Next.js may pass `searchParams` as a Promise in some versions/configs.
  searchParams?: Promise<{ error?: string; next?: string }> | { error?: string; next?: string };
}) {
  const user = await getCurrentUserFromBackend();
  const sp = (searchParams ? await searchParams : undefined) ?? {};
  const error = sp.error;

  if (user) {
    const next = typeof sp.next === "string" ? sp.next : "/";
    return (
      <main className="card cardPadding">
        <h1 className="title">You’re already signed in</h1>
        <p className="muted" style={{ marginTop: 10 }}>
          Redirecting to your account…
        </p>
        <meta httpEquiv="refresh" content={`0;url=${next}`} />
      </main>
    );
  }

  // Errors are shown via the global toast component from query params.
  const errorText = "";

  return (
    <main className="authShell">
      <div className="authCard card">
        <h1 className="title">Log in</h1>
        <p className="muted" style={{ marginTop: 8, lineHeight: 1.5 }}>
          Sign in to request bookings and manage approvals.
        </p>

        {errorText ? (
          <div className="errorBanner" role="alert">
            {errorText}
          </div>
        ) : null}

        <form method="post" action={`${BACKEND_URL}/api/auth/login`} className="authForm">
          <input type="hidden" name="next" value={typeof sp.next === "string" ? sp.next : "/"} />
          <label className="fieldLabel">
            Email (or `admin` for bootstrap)
            <input className="input" name="email" required placeholder="you@example.com  or  admin" />
          </label>

          <label className="fieldLabel" style={{ marginTop: 12, display: "block" }}>
            Password
            <input className="input" name="password" type="password" required placeholder="••••••" />
          </label>

          <button className="btn btnPrimary" type="submit" style={{ width: "100%", marginTop: 16 }}>
            Log in
          </button>
        </form>

        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div className="muted" style={{ fontSize: 13 }}>
            Admin bootstrap: <b>admin</b> / <b>admin</b>
          </div>
          <Link href="/auth/register" className="btn">
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}

