"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Movie } from "@/lib/types";

type Props = {
  movies: Movie[];
  intervalMs?: number;
};

function normalizePosterUrl(m: Movie) {
  return m.posterUrl ?? null;
}

function normalizeBannerUrl(m: Movie) {
  // Mapping rule: banner uses the second admin image (`bannerUrl`).
  return m.bannerUrl ?? null;
}

export default function FeaturedAlbumGallery({ movies, intervalMs = 6000 }: Props) {
  const usable = useMemo(() => movies.filter((m) => (normalizeBannerUrl(m) ?? normalizePosterUrl(m)) !== null), [movies]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (usable.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % usable.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [usable.length, intervalMs]);

  const current = usable[index];
  const next = usable[(index + 1) % usable.length];
  const next2 = usable[(index + 2) % usable.length];

  if (!current) return null;

  return (
    <div className="featuredAlbum" aria-label="Featured movies gallery">
      <div className="featuredAlbumGlow" />

      <div className="featuredAlbumStage">
        <div className="featuredAlbumSide featuredAlbumSide2" aria-hidden="true">
          <Link href={`/customer/movie/${next2.id}`} className="featuredAlbumSideLink">
            <div className="featuredAlbumSideImg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={normalizeBannerUrl(next2) ?? normalizePosterUrl(next2) ?? ""} alt="" />
            </div>
          </Link>
        </div>

        <div className="featuredAlbumSide featuredAlbumSide1" aria-hidden="true">
          <Link href={`/customer/movie/${next.id}`} className="featuredAlbumSideLink">
            <div className="featuredAlbumSideImg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={normalizeBannerUrl(next) ?? normalizePosterUrl(next) ?? ""} alt="" />
            </div>
          </Link>
        </div>

        <Link href={`/customer/movie/${current.id}`} className="featuredAlbumMainLink">
          <div className="featuredAlbumMainInner" key={current.id}>
            <div className="featuredAlbumMainImg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={normalizeBannerUrl(current) ?? normalizePosterUrl(current) ?? ""} alt={`${current.title ?? "Movie"} banner`} />
            </div>

            <div className="featuredAlbumMainOverlay">
              <div className="featuredAlbumTitle">{current.title?.trim() ? current.title : "Untitled Movie"}</div>
              <div className="featuredAlbumSubtitle">View showtimes</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

