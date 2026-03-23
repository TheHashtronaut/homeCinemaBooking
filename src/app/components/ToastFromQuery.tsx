"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ToastType = "success" | "error";

const MESSAGE_BY_CODE: Record<string, string> = {
  UNAUTHORIZED: "Please log in.",
  FORBIDDEN: "You don’t have permission to do that.",
  INVALID_INPUT: "Something went wrong. Please check your input.",
  AUTH_INVALID: "Invalid email or password.",
  EMAIL_EXISTS: "That email is already registered.",
  NOT_FOUND: "We couldn’t find the requested item.",
  NO_CAPACITY: "No capacity left for this showtime.",
  SHOWTIME_ENDED: "This showtime has already ended.",
  BOOKING_NOT_PENDING: "This booking request is no longer pending.",
  SESSION_EXPIRED: "Your session expired. Please log in again.",
};

export default function ToastFromQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const toastType = searchParams.get("toast") as ToastType | null;
  const code = searchParams.get("code") ?? "";

  const message = useMemo(() => {
    if (!code) return "";
    return MESSAGE_BY_CODE[code] ?? "Something went wrong.";
  }, [code]);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!toastType || !code) return;
    setOpen(true);

    // Clear query params after showing the toast to avoid re-triggering.
    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    params.delete("code");
    const next = params.toString() ? `?${params.toString()}` : "";
    router.replace(`${window.location.pathname}${next}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toastType, code]);

  if (!open || !toastType) return null;

  const bg =
    toastType === "error"
      ? "rgba(252,165,165,0.14)"
      : "rgba(125,211,252,0.14)";
  const border =
    toastType === "error" ? "rgba(252,165,165,0.55)" : "rgba(125,211,252,0.55)";

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 18,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        width: "min(680px, calc(100% - 28px))",
      }}
    >
      <div
        style={{
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 16,
          padding: "12px 14px",
          backdropFilter: "blur(10px)",
          color: "rgba(255,255,255,0.96)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14 }}>
          {toastType === "error" ? "Error" : "Success"}: {message}
        </div>
        <button
          className="btn"
          type="button"
          onClick={() => setOpen(false)}
          style={{ padding: "8px 10px" }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

