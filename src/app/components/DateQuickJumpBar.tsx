"use client";

import { useMemo, useState } from "react";

type DateJump = {
  id: string; // stable date id (YYYY-MM-DD)
  label: string;
};

export default function DateQuickJumpBar({ dates }: { dates: DateJump[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const items = useMemo(() => dates, [dates]);

  if (items.length === 0) return null;

  return (
    <div className="dateQuickJumpBar" aria-label="Quick jump by date">
      <div className="dateQuickJumpInner">
        {items.map((d) => {
          const isActive = activeId === d.id;
          return (
            <button
              key={d.id}
              type="button"
              className={`dateQuickJumpButton ${isActive ? "dateQuickJumpButtonActive" : ""}`}
              onClick={() => {
                const el = document.getElementById(`date-${d.id}`);
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
                setActiveId(d.id);
              }}
            >
              {d.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

