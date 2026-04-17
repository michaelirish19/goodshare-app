"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { writeActivity } from "../lib/writeActivity";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";

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
};

function now() {
  return Math.floor(Date.now() / 1000);
}

function daysSince(seconds: number) {
  return (now() - seconds) / 86400;
}

function getTierStyle(tier: Badge["tier"]) {
  switch (tier) {
    case "onboarding":
      return {
        bg: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
        border: "#6ee7b7",
        text: "#065f46",
        glow: "0 0 8px rgba(16, 185, 129, 0.3)",
      };
    case "activity":
      return {
        bg: "linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)",
        border: "#fcd34d",
        text: "#78350f",
        glow: "0 0 8px rgba(251, 191, 36, 0.3)",
      };
    case "trust":
      return {
        bg: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
        border: "#86efac",
        text: "#14532d",
        glow: "0 0 8px rgba(34, 197, 94, 0.3)",
      };
    case "reach":
      return {
        bg: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
        border: "#c4b5fd",
        text: "#4c1d95",
        glow: "0 0 8px rgba(139, 92, 246, 0.3)",
      };
    case "community":
      return {
        bg: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
        border: "#f9a8d4",
        text: "#831843",
        glow: "0 0 8px rgba(236, 72, 153, 0.3)",
      };
  }
}

function getCertifiedStyle() {
  return {
    bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)",
    border: "#f59e0b",
    text: "#3a2e00",
    glow: "0 0 12px rgba(245, 158, 11, 0.5)",
  };
}

export default function BadgeDisplay({
  recommenderId,
  recommenderData,
  recommendationCount,
}: Props) {
  const [maxPickClicks, setMaxPickClicks] = useState(0);
  const [loadingClicks, setLoadingClicks] = useState(true);
  const [seenBadges, setSeenBadges] = useState<string[]>([]);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsOwner(!!user && user.uid === recommenderId);
    });
    return () => unsubscribe();
  }, [recommenderId]);

  useEffect(() => {
    async function fetchData() {
      try {
        const recsRef = collection(db, "recommenders", recommenderId, "recommendations");
        const q = query(recsRef, orderBy("outboundClickCount", "desc"), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setMaxPickClicks(data.outboundClickCount ?? 0);
        }

        // Fetch seen badges
        const profileRef = doc(db, "recommenders", recommenderId);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setSeenBadges(data.seenBadges ?? []);
        }
      } catch (err) {
        console.error("Failed to fetch badge data:", err);
      } finally {
        setLoadingClicks(false);
      }
    }
    fetchData();
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
    earnedBadges.push({ id: "founding_sharer", label: "Founding Sharer", description: "Joined GoodShare during beta", emoji: "🌱", tier: "onboarding" });
  }
  if (recommendationCount >= 1) {
    earnedBadges.push({ id: "first_pick", label: "First Pick", description: "Added your first pick", emoji: "📌", tier: "onboarding" });
  }
  if (name?.trim() && role?.trim() && description?.trim()) {
    earnedBadges.push({ id: "profile_complete", label: "Profile Complete", description: "Filled out your full profile", emoji: "✅", tier: "onboarding" });
  }

  // ── First Steps (checklist completion) ──
  if (recommendationCount >= 1 && totalOutboundClickCount >= 1 && totalRatings >= 1) {
    earnedBadges.push({ id: "first_steps", label: "First Steps", description: "Added a pick, got a click, and earned a rating", emoji: "🚀", tier: "onboarding" });
  }

  // ── Activity ──
  if (recommendationCount >= 10) earnedBadges.push({ id: "curator", label: "Curator", description: "Added 10 picks", emoji: "📋", tier: "activity" });
  if (recommendationCount >= 25) earnedBadges.push({ id: "collector", label: "Collector", description: "Added 25 picks", emoji: "🗂️", tier: "activity" });
  if (recommendationCount >= 50) earnedBadges.push({ id: "librarian", label: "Librarian", description: "Added 50 picks", emoji: "📚", tier: "activity" });
  if (recommendationCount >= 100) earnedBadges.push({ id: "archivist", label: "Archivist", description: "Added 100 picks", emoji: "🏛️", tier: "activity" });
  if (lastActiveSeconds > 0 && daysSince(createdSeconds) >= 30 && daysSince(lastActiveSeconds) <= 30) {
    earnedBadges.push({ id: "consistent", label: "Consistent", description: "Active for 30 consecutive days", emoji: "🔄", tier: "activity" });
  }
  if (daysSince(createdSeconds) >= 180) earnedBadges.push({ id: "hero", label: "Hero", description: "Active member for 6 months", emoji: "🦸", tier: "activity" });
  if (daysSince(createdSeconds) >= 365) earnedBadges.push({ id: "superhero", label: "Superhero", description: "Active member for 1 year", emoji: "🦸‍♂️", tier: "activity" });

  // ── Trust ──
  if (totalRatings >= 1) earnedBadges.push({ id: "first_rating", label: "First Rating", description: "Received your first rating", emoji: "⭐", tier: "trust" });
  if (totalRatings >= 10 && avgScore >= 70) earnedBadges.push({ id: "trusted", label: "Trusted", description: "70+ avg score over 10+ ratings", emoji: "✔️", tier: "trust" });
  if (totalRatings >= 20 && avgScore >= 85) earnedBadges.push({ id: "highly_trusted", label: "Highly Trusted", description: "85+ avg score over 20+ ratings", emoji: "💚", tier: "trust" });
  if (totalRatings >= 25 && avgScore >= 95) earnedBadges.push({ id: "certified", label: "Certified GoodShare", description: "95+ avg score over 25+ ratings", emoji: "🏆", tier: "trust" });

  // ── Reach ──
  if (totalOutboundClickCount >= 1) earnedBadges.push({ id: "first_click", label: "First Click", description: "Your first tracked outbound click", emoji: "👆", tier: "reach" });
  if (totalOutboundClickCount >= 100) earnedBadges.push({ id: "broadcaster", label: "Broadcaster", description: "100 total outbound clicks", emoji: "📡", tier: "reach" });
  if (totalOutboundClickCount >= 500) earnedBadges.push({ id: "ripple", label: "Ripple", description: "500 total outbound clicks", emoji: "💧", tier: "reach" });
  if (!loadingClicks && maxPickClicks >= 200) earnedBadges.push({ id: "wildfire", label: "Wildfire", description: "A single pick hit 200+ clicks", emoji: "🔥", tier: "reach" });
  if (!loadingClicks && maxPickClicks >= 500) earnedBadges.push({ id: "inferno", label: "Inferno", description: "A single pick hit 500+ clicks", emoji: "🌋", tier: "reach" });

  // ── Community ──
  if (referralCount >= 3) earnedBadges.push({ id: "connector", label: "Connector", description: "Brought in 3 new sharers", emoji: "🤝", tier: "community" });
  if (referralCount >= 10) earnedBadges.push({ id: "ambassador", label: "Ambassador", description: "Brought in 10 new sharers", emoji: "🌍", tier: "community" });
  if (referralCount >= 25) earnedBadges.push({ id: "good_sharer", label: "Good Sharer", description: "Brought in 25 new sharers", emoji: "🌟", tier: "community" });

  // ── Detect new badges and notify owner ──
  useEffect(() => {
    if (!isOwner || loadingClicks || seenBadges.length === 0 || earnedBadges.length === 0) return;

    const earnedIds = earnedBadges.map((b) => b.id);
    const newOnes = earnedBadges.filter((b) => !seenBadges.includes(b.id));

    if (newOnes.length === 0) return;

    // Show toast for the first new badge
    setNewBadge(newOnes[0]);
setShowToast(true);

// Write activity for each new badge
newOnes.forEach((badge) => {
  writeActivity("badge_earned", recommenderId, recommenderData.name, {
    badgeLabel: badge.label,
    badgeEmoji: badge.emoji,
  });
});

    // Mark all earned badges as seen
    const profileRef = doc(db, "recommenders", recommenderId);
    updateDoc(profileRef, {
      seenBadges: arrayUnion(...earnedIds),
    }).catch(console.error);

    const timer = setTimeout(() => setShowToast(false), 4000);
    return () => clearTimeout(timer);
  }, [isOwner, loadingClicks, seenBadges.length, earnedBadges.length]);

  // ── Initialize seenBadges for first time ──
  useEffect(() => {
    if (!isOwner || loadingClicks || seenBadges.length > 0 || earnedBadges.length === 0) return;

    const earnedIds = earnedBadges.map((b) => b.id);
    const profileRef = doc(db, "recommenders", recommenderId);
    updateDoc(profileRef, {
      seenBadges: earnedIds,
    }).catch(console.error);

    setSeenBadges(earnedIds);
  }, [isOwner, loadingClicks, seenBadges.length, earnedBadges.length]);

  if (earnedBadges.length === 0) return null;

  const tierOrder = ["onboarding", "trust", "activity", "reach", "community"];
  const sorted = [...earnedBadges].sort(
    (a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier)
  );

  return (
    <>
      {/* ── Badge grid ── */}
      <div className="mt-5 border-t border-gray-100 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Badges
        </p>
        <div className="flex flex-wrap gap-2">
          {sorted.map((badge) => {
            const style = badge.id === "certified" ? getCertifiedStyle() : getTierStyle(badge.tier);
            const isNew = isOwner && !seenBadges.includes(badge.id);
            return (
              <div key={badge.id} className="group relative">
                <span
                  className="inline-flex cursor-default items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-transform hover:scale-105"
                  style={{
                    background: style.bg,
                    border: `1.5px solid ${style.border}`,
                    color: style.text,
                    boxShadow: style.glow,
                  }}
                >
                  <span className="text-sm">{badge.emoji}</span>
                  {badge.label}
                  {isNew && (
                    <span className="ml-0.5 inline-flex h-2 w-2 rounded-full bg-red-500" />
                  )}
                </span>

                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-xl border border-gray-100 bg-white px-3 py-2 text-center shadow-lg group-hover:block">
                  <p className="whitespace-nowrap text-xs font-semibold text-gray-900">
                    {badge.emoji} {badge.label}
                  </p>
                  <p className="mt-0.5 whitespace-nowrap text-xs text-gray-500">
                    {badge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── New badge toast notification ── */}
      {showToast && newBadge && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-bounce"
          style={{ animationDuration: "0.6s", animationIterationCount: 2 }}
        >
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-xl">
              {newBadge.emoji}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Badge unlocked!
              </p>
              <p className="text-sm font-bold text-gray-900">{newBadge.label}</p>
              <p className="text-xs text-gray-500">{newBadge.description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}