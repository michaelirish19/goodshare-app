"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

type Props = {
  recommenderId: string;
};

type TrustLevel = {
  label: string;
  color: string;
  textColor: string;
  barColor: string;
};

function getTrustLevel(score: number, totalRatings: number): TrustLevel {
  if (totalRatings < 3) {
    return {
      label: "Not enough ratings yet",
      color: "#f3f4f6",
      textColor: "#9ca3af",
      barColor: "#d1d5db",
    };
  }
  if (score < 31) {
    return {
      label: "Not Trusted",
      color: "#fee2e2",
      textColor: "#991b1b",
      barColor: "#dc2626",
    };
  }
  if (score < 70) {
    return {
      label: "Trusted",
      color: "#dcfce7",
      textColor: "#166534",
      barColor: "#16a34a",
    };
  }
  if (score < 85) {
    return {
      label: "Highly Trusted",
      color: "#dcfce7",
      textColor: "#14532d",
      barColor: "#15803d",
    };
  }
  if (score < 95) {
    return {
      label: "Elite Sharer",
      color: "#dcfce7",
      textColor: "#14532d",
      barColor: "#166534",
    };
  }
  return {
    label: "Certified GoodShare",
    color: "#fef9c3",
    textColor: "#3a2e00",
    barColor: "#CFB53B",
  };
}

export default function TrustMeter({ recommenderId }: Props) {
  const [totalRatings, setTotalRatings] = useState(0);
  const [totalRatingScore, setTotalRatingScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "recommenders", recommenderId);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setTotalRatings(data.totalRatings ?? 0);
        setTotalRatingScore(data.totalRatingScore ?? 0);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [recommenderId]);

  if (loading) {
    return (
      <div className="mt-3">
        <div className="h-2.5 w-36 animate-pulse rounded-full bg-gray-100" />
      </div>
    );
  }

  const score = totalRatings > 0
    ? Math.round(totalRatingScore / totalRatings)
    : 0;

  const trust = getTrustLevel(score, totalRatings);
  const barWidth = totalRatings < 3 ? 0 : score;

  return (
    <div className="mt-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
        Trust rating
      </p>

      {/* Bar */}
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-36 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${barWidth}%`,
              backgroundColor: trust.barColor,
            }}
          />
        </div>
        <span className="text-xs font-medium" style={{ color: trust.barColor }}>
          {totalRatings < 3 ? "–" : `${score}`}
        </span>
      </div>

      {/* Label + rating count */}
      <div className="mt-1.5 flex items-center gap-2">
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{
            backgroundColor: trust.color,
            color: trust.textColor,
          }}
        >
          {trust.label}
        </span>
        <span className="text-xs text-gray-400">
          {totalRatings === 0
            ? "No ratings yet"
            : totalRatings < 3
            ? `${totalRatings} rating${totalRatings === 1 ? "" : "s"} — need 3 to display score`
            : `${totalRatings} rating${totalRatings === 1 ? "" : "s"}`}
        </span>
      </div>
    </div>
  );
}