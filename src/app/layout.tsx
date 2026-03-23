import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

import { BACKEND_URL, getCurrentUserFromBackend } from "@/lib/backendApi";
import ToastFromQuery from "./components/ToastFromQuery";

export const metadata: Metadata = {
  title: "Home Cinema Booking",
  description: "Book home cinema slots with approval workflow.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserFromBackend();

  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="siteHeader">
            <div className="siteHeaderInner">
              <div className="siteBrand">
                <div className="siteLogo">The Hastronema</div>
                <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                  Book slots. Harsh Approved.
                </div>
              </div>

              <nav className="siteNav">
                <Link className="navLink" href="/">
                  Home
                </Link>
                <Link className="navLink" href="/customer">
                  Movies & Times
                </Link>
                <Link className="navLink" href="/admin">
                  Admin
                </Link>
              </nav>

              <div className="siteAuth">
                {user ? (
                  <>
                    <div className="authPill">
                      <div style={{ fontWeight: 750 }}>{user.name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {user.role === "admin" ? "Admin" : "Customer"}
                      </div>
                    </div>
                    <form action={`${BACKEND_URL}/api/auth/logout`} method="post">
                      <button className="btn" type="submit">
                        Log out
                      </button>
                    </form>
                  </>
                ) : (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <Link className="btn" href="/auth/login">
                      Log in
                    </Link>
                    <Link className="btn btnPrimary" href="/auth/register">
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </header>
          {children}

          <footer className="siteFooter">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div className="muted" style={{ fontSize: 13 }}>
                Home Cinema Booking · Local JSON prototype
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                Capacity per slot: <b>10</b>
              </div>
            </div>
          </footer>
        </div>

        <ToastFromQuery />
      </body>
    </html>
  );
}

