"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

type Props = {
  recommenderId: string;
  recommenderData: {
    name: string;
    role: string;
    description?: string;
    createdAt?: { seconds: number };
    lastActiveAt?: { seconds: number };
    totalRatings?: number;
    totalRatingScore?: number;
    totalOutboundClickCount?: number;
    referralCount?: number;
    isBetaUser?: boolean;
  };
  recommendationCount: number;
};

type Badge = {
  id: string;
  label: string;
  description: string;
  emoji: string;
  tier: "onboarding" | "activity" | "trust" | "reach" | "community";
  color: string;
  textColor: string;
};

function now() {
  return Math.floor(Date.now() / 1000);
}

function daysSince(seconds: number) {
  return (now() - seconds) / 86400;
}

export default function BadgeDisplay({
  recommenderId,
  recommenderData,
  recommendationCount,
}: Props) {
  const [maxPickClicks, setMaxPickClicks] = useState(0);
  const [loadingClicks, setLoadingClicks] = useState(true);

  // Fetch max outbound clicks on any single pick
  useEffect(() => {
    async function fetchMaxPickClicks() {
      try {
        const recsRef = collection(db, "recommenders", recommenderId, "recommendations");
        const q = query(recsRef, orderBy("outboundClickCount", "desc"), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setMaxPickClicks(data.outboundClickCount ?? 0);
        }
      } catch (err) {
        console.error("Failed to fetch pick clicks:", err);
      } finally {
        setLoadingClicks(false);
      }
    }
    fetchMaxPickClicks();
  }, [recommenderId]);

  const {
    name,
    role,
    description,
    createdAt,
    lastActiveAt,
    totalRatings = 0,
    totalRatingScore = 0,
    totalOutboundClickCount = 0,
    referralCount = 0,
    isBetaUser = false,
  } = recommenderData;

  const avgScore = totalRatings > 0 ? totalRatingScore / totalRatings : 0;
  const createdSeconds = createdAt?.seconds ?? now();
  const lastActiveSeconds = lastActiveAt?.seconds ?? 0;

  const earnedBadges: Badge[] = [];

  // ── Onboarding ──
  if (isBetaUser) {
    earnedBadges.push({
      id: "founding_sharer",
      label: "Founding Sharer",
      description: "Joined GoodShare during beta",
      emoji: "🌱",
      tier: "onboarding",
      color: "#dcfce7",
      textColor: "#166534",
    });
  }

  if (recommendationCount >= 1) {
    earnedBadges.push({
      id: "first_pick",
      label: "First Pick",
      description: "Added your first pick",
      emoji: "📌",
      tier: "onboarding",
      color: "#e0f2fe",
      textColor: "#0369a1",
    });
  }

  if (name?.trim() && role?.trim() && description?.trim()) {
    earnedBadges.push({
      id: "profile_complete",
      label: "Profile Complete",
      description: "Filled out your full profile",
      emoji: "✅",
      tier: "onboarding",
      color: "#e0f2fe",
      textColor: "#0369a1",
    });
  }

  // ── Activity ──
  if (recommendationCount >= 10) {
    earnedBadges.push({
      id: "curator",
      label: "Curator",
      description: "Added 10 picks",
      emoji: "📋",
      tier: "activity",
      color: "#fef9c3",
      textColor: "#854d0e",
    });
  }

  if (recommendationCount >= 25) {
    earnedBadges.push({
      id: "collector",
      label: "Collector",
      description: "Added 25 picks",
      emoji: "🗂️",
      tier: "activity",
      color: "#fef9c3",
      textColor: "#854d0e",
    });
  }

  if (recommendationCount >= 50) {
    earnedBadges.push({
      id: "librarian",
      label: "Librarian",
      description: "Added 50 picks",
      emoji: "📚",
      tier: "activity",
      color: "#fef9c3",
      textColor: "#854d0e",
    });
  }

  if (recommendationCount >= 100) {
    earnedBadges.push({
      id: "archivist",
      label: "Archivist",
      description: "Added 100 picks",
      emoji: "🏛️",
      tier: "activity",
      color: "#fef9c3",
      textColor: "#854d0e",
    });
  }

  if (lastActiveSeconds > 0 && daysSince(createdSeconds) >= 30 && daysSince(lastActiveSeconds) <= 30) {
    earnedBadges.push({
      id: "consistent",
      label: "Consistent",
      description: "Active for 30 consecutive days",
      emoji: "🔄",
      tier: "activity",
      color: "#fef9c3",
      textColor: "#854d0e",
    });
  }

  if (daysSince(createdSeconds) >= 180) {
    earnedBadges.push({
      id: "hero",
      label: "Hero",
      description: "Active member for 6 months",
      emoji: "🦸",
      tier: "activity",
      color: "#fef9c3",
      textColor: "#854d0e",
    });
  }

  if (daysSince(createdSeconds) >= 365) {
    earnedBadges.push({
      id: "superhero",
      label: "Superhero",
      description: "Active member for 1 year",
      emoji: "🦸‍♂️",
      tier: "activity",
      color: "#fef9c3",
      textColor: "#854d0e",
    });
  }

  // ── Trust ──
  if (totalRatings >= 1) {
    earnedBadges.push({
      id: "first_rating",
      label: "First Rating",
      description: "Received your first rating",
      emoji: "⭐",
      tier: "trust",
      color: "#dcfce7",
      textColor: "#166534",
    });
  }

  if (totalRatings >= 10 && avgScore >= 70) {
    earnedBadges.push({
      id: "trusted",
      label: "Trusted",
      description: "70+ avg score over 10+ ratings",
      emoji: "✔️",
      tier: "trust",
      color: "#dcfce7",
      textColor: "#166534",
    });
  }

  if (totalRatings >= 20 && avgScore >= 85) {
    earnedBadges.push({
      id: "highly_trusted",
      label: "Highly Trusted",
      description: "85+ avg score over 20+ ratings",
      emoji: "💚",
      tier: "trust",
      color: "#dcfce7",
      textColor: "#166534",
    });
  }

  if (totalRatings >= 25 && avgScore >= 95) {
    earnedBadges.push({
      id: "certified",
      label: "Certified GoodShare",
      description: "95+ avg score over 25+ ratings",
      emoji: "🏆",
      tier: "trust",
      color: "#fef9c3",
      textColor: "#3a2e00",
    });
  }

  // ── Reach ──
  if (totalOutboundClickCount >= 1) {
    earnedBadges.push({
      id: "first_click",
      label: "First Click",
      description: "Your first tracked outbound click",
      emoji: "👆",
      tier: "reach",
      color: "#ede9fe",
      textColor: "#5b21b6",
    });
  }

  if (totalOutboundClickCount >= 100) {
    earnedBadges.push({
      id: "broadcaster",
      label: "Broadcaster",
      description: "100 total outbound clicks",
      emoji: "📡",
      tier: "reach",
      color: "#ede9fe",
      textColor: "#5b21b6",
    });
  }

  if (totalOutboundClickCount >= 500) {
    earnedBadges.push({
      id: "ripple",
      label: "Ripple",
      description: "500 total outbound clicks",
      emoji: "💧",
      tier: "reach",
      color: "#ede9fe",
      textColor: "#5b21b6",
    });
  }

  if (!loadingClicks && maxPickClicks >= 200) {
    earnedBadges.push({
      id: "wildfire",
      label: "Wildfire",
      description: "A single pick hit 200+ clicks",
      emoji: "🔥",
      tier: "reach",
      color: "#ede9fe",
      textColor: "#5b21b6",
    });
  }

  if (!loadingClicks && maxPickClicks >= 500) {
    earnedBadges.push({
      id: "inferno",
      label: "Inferno",
      description: "A single pick hit 500+ clicks",
      emoji: "🌋",
      tier: "reach",
      color: "#ede9fe",
      textColor: "#5b21b6",
    });
  }

  // ── Community ──
  if (referralCount >= 3) {
    earnedBadges.push({
      id: "connector",
      label: "Connector",
      description: "Brought in 3 new sharers",
      emoji: "🤝",
      tier: "community",
      color: "#fce7f3",
      textColor: "#9d174d",
    });
  }

  if (referralCount >= 10) {
    earnedBadges.push({
      id: "ambassador",
      label: "Ambassador",
      description: "Brought in 10 new sharers",
      emoji: "🌍",
      tier: "community",
      color: "#fce7f3",
      textColor: "#9d174d",
    });
  }

  if (referralCount >= 25) {
    earnedBadges.push({
      id: "good_sharer",
      label: "Good Sharer",
      description: "Brought in 25 new sharers",
      emoji: "🌟",
      tier: "community",
      color: "#fce7f3",
      textColor: "#9d174d",
    });
  }

  if (earnedBadges.length === 0) {
    return null;
  }

  const tierOrder = ["onboarding", "trust", "activity", "reach", "community"];
  const sorted = [...earnedBadges].sort(
    (a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier)
  );

  return (
    <div className="mt-5 border-t border-gray-100 pt-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
        Badges
      </p>
      <div className="flex flex-wrap gap-2">
        {sorted.map((badge) => (
          <div
            key={badge.id}
            title={badge.description}
            className="group relative"
          >
            <span
              className="inline-flex cursor-default items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: badge.color, color: badge.textColor }}
            >
              <span>{badge.emoji}</span>
              {badge.label}
            </span>

            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-center shadow-md group-hover:block">
              <p className="whitespace-nowrap text-xs font-medium text-gray-800">
                {badge.label}
              </p>
              <p className="mt-0.5 whitespace-nowrap text-xs text-gray-500">
                {badge.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}