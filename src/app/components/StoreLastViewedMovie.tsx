"use client";

import { useEffect } from "react";

export default function StoreLastViewedMovie({ movieId }: { movieId: string }) {
  useEffect(() => {
    if (!movieId) return;
    try {
      localStorage.setItem("hc_last_viewed_movie", movieId);
    } catch {
      // Ignore storage errors (private mode, blocked storage, etc.)
    }
  }, [movieId]);

  return null;
}

