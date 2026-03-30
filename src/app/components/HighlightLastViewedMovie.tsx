"use client";

import { useEffect } from "react";

export default function HighlightLastViewedMovie() {
  useEffect(() => {
    let id = "";
    try {
      id = localStorage.getItem("hc_last_viewed_movie") ?? "";
    } catch {
      // ignore
    }

    if (!id) return;

    const el = document.querySelector(`[data-movie-card="${id}"]`);
    if (!el) return;

    el.classList.add("lastViewedGlow");
  }, []);

  return null;
}

