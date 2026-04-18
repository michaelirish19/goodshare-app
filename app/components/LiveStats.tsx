"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

type Stats = {
  totalSharers: number;
  totalPicks: number;
  totalClicks: number;
};

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function LiveStats() {
  const [stats, setStats] = useState<Stats>({
    totalSharers: 0,
    totalPicks: 0,
    totalClicks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "stats", "global");
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStats({
          totalSharers: data.totalSharers ?? 0,
          totalPicks: data.totalPicks ?? 0,
          totalClicks: data.totalClicks ?? 0,
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="mb-8 flex gap-8 border-y border-gray-100 py-5">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-8 w-12 animate-pulse rounded bg-gray-100" />
            <div className="mt-1 h-3 w-16 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8 flex gap-8 border-y border-gray-100 py-5">
      <div>
        <p className="text-2xl font-bold">{formatNumber(stats.totalSharers)}</p>
        <p className="text-xs text-gray-500">Sharers</p>
      </div>
      <div>
        <p className="text-2xl font-bold">{formatNumber(stats.totalPicks)}</p>
        <p className="text-xs text-gray-500">Picks</p>
      </div>
      <div>
        <p className="text-2xl font-bold">{formatNumber(stats.totalClicks)}</p>
        <p className="text-xs text-gray-500">Clicks tracked</p>
      </div>
    </div>
  );
}