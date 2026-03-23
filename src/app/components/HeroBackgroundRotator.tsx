"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  images: string[];
  intervalMs?: number;
};

export default function HeroBackgroundRotator({ images, intervalMs = 5500 }: Props) {
  const usable = useMemo(() => images.filter(Boolean), [images]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (usable.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % usable.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [usable.length, intervalMs]);

  if (usable.length === 0) return null;

  const url = usable[index] ?? usable[0];

  return (
    <div className="heroBgLayerWrap" aria-hidden="true">
      <div key={url} className="heroBgLayer" style={{ backgroundImage: `url(${url})` }} />
    </div>
  );
}

