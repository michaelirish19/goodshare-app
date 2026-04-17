"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";

type ActivityItem = {
  id: string;
  type: "new_pick" | "badge_earned" | "rating_received" | "new_sharer";
  recommenderId: string;
  recommenderName: string;
  payload: {
    pickTitle?: string;
    pickId?: string;
    badgeLabel?: string;
    badgeEmoji?: string;
  };
  createdAt: { seconds: number };
};

function timeAgo(seconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  const base = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm";
  switch (type) {
    case "new_pick":
      return <div className={`${base} bg-blue-100`}>📌</div>;
    case "badge_earned":
      return <div className={`${base} bg-yellow-100`}>🏅</div>;
    case "rating_received":
      return <div className={`${base} bg-green-100`}>⭐</div>;
    case "new_sharer":
      return <div className={`${base} bg-purple-100`}>🌱</div>;
  }
}

function activityText(item: ActivityItem): { text: string; href: string } {
  const name = item.recommenderName;
  const profileHref = `/recommenders/${item.recommenderId}`;

  switch (item.type) {
    case "new_pick":
      return {
        text: `${name} added a new pick: ${item.payload.pickTitle || "a pick"}`,
        href: item.payload.pickId
          ? `/recommenders/${item.recommenderId}/recommendations/${item.payload.pickId}`
          : profileHref,
      };
    case "badge_earned":
      return {
        text: `${name} earned the ${item.payload.badgeLabel || "a"} badge ${item.payload.badgeEmoji || "🏅"}`,
        href: profileHref,
      };
    case "rating_received":
      return {
        text: `${name} received a new rating ⭐`,
        href: profileHref,
      };
    case "new_sharer":
      return {
        text: `${name} just joined GoodShare 🌱`,
        href: profileHref,
      };
  }
}

export default function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "activity"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: ActivityItem[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ActivityItem, "id">),
      }));

      // Filter out current user's own activity
      const filtered = currentUserId
        ? data.filter((item) => item.recommenderId !== currentUserId)
        : data;

      setItems(filtered);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  if (loading) {
    return (
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Community</p>
            <h2 className="text-2xl font-bold">Activity</h2>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded bg-gray-200" />
                <div className="h-2 w-1/4 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mb-10">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Community</p>
          <h2 className="text-2xl font-bold">Activity</h2>
        </div>
        <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center">
          <p className="text-sm text-gray-400">No activity yet — be the first to add a pick!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Community</p>
          <h2 className="text-2xl font-bold">Activity</h2>
        </div>
        <span className="text-xs text-gray-400">Live</span>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const { text, href } = activityText(item);
          return (
            <a
              key={item.id}
              href={href}
              className="flex items-start gap-3 rounded-2xl border border-gray-100 p-4 transition hover:border-gray-200 hover:bg-gray-50"
            >
              <ActivityIcon type={item.type} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800 leading-snug">{text}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {item.createdAt?.seconds ? timeAgo(item.createdAt.seconds) : "recently"}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}