import Link from "next/link";

import { BACKEND_URL, getCurrentUserFromBackend } from "@/lib/backendApi";

export default async function RegisterPage({
  searchParams,
}: {
  // Next.js may pass `searchParams` as a Promise in some versions/configs.
  searchParams?: Promise<{ error?: string }> | { error?: string };
}) {
  const user = await getCurrentUserFromBackend();
  const sp = (searchParams ? await searchParams : undefined) ?? {};
  const error = sp.error;

  if (user) {
    return (
      <main className="card cardPadding">
        <h1 className="title">You’re already signed in</h1>
        <p className="muted" style={{ marginTop: 10 }}>
          Go to <a href="/customer">Customer</a> or <a href="/admin">Admin</a>.
        </p>
      </main>
    );
  }

  // Errors are shown via the global toast component from query params.
  const errorText = "";

  return (
    <main className="authShell">
      <div className="authCard card">
        <h1 className="title">Create account</h1>
        <p className="muted" style={{ marginTop: 8, lineHeight: 1.5 }}>
          Register as a customer. Admin is bootstrapped separately using <b>admin</b> / <b>admin</b>.
        </p>

        {errorText ? (
          <div className="errorBanner" role="alert">
            {errorText}
          </div>
        ) : null}

        <form method="post" action={`${BACKEND_URL}/api/auth/register`} className="authForm">
          <label className="fieldLabel">
            Name
            <input className="input" name="name" type="text" required placeholder="Your name" />
          </label>

          <label className="fieldLabel" style={{ marginTop: 12, display: "block" }}>
            Email
            <input className="input" name="email" type="email" required placeholder="you@example.com" />
          </label>

          <label className="fieldLabel" style={{ marginTop: 12, display: "block" }}>
            Password
            <input className="input" name="password" type="password" required minLength={6} placeholder="At least 6 characters" />
          </label>

          <label className="fieldLabel" style={{ marginTop: 12, display: "block" }}>
            Admin code (optional)
            <input className="input" name="adminCode" type="text" placeholder="(leave blank for customer)" />
          </label>

          <button className="btn btnPrimary" type="submit" style={{ width: "100%", marginTop: 16 }}>
            Create account
          </button>
        </form>

        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div className="statusChip statusChipApproved" style={{ padding: "8px 10px" }}>
              Customer account
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              Use <b>/data/db.json</b> to inspect stored users.
            </div>
          </div>
          <Link href="/auth/login" className="btn">
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}

