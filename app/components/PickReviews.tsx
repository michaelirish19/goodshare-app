"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

type Rating = {
  id: string;
  reviewerId: string;
  reviewerName: string;
  score: number;
  note: string;
  verified: boolean;
  createdAt: { seconds: number };
};

type Props = {
  recommenderId: string;
  recommendationId: string;
};

function timeAgo(seconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 86400 * 365) return `${Math.floor(diff / (86400 * 30))}mo ago`;
  return `${Math.floor(diff / (86400 * 365))}y ago`;
}

function getScoreStyle(score: number): { bg: string; text: string; label: string } {
  if (score === 0) return { bg: "#1a1a1a", text: "#ffffff", label: "Not Trusted" };
  if (score <= 30) return { bg: "#dc2626", text: "#ffffff", label: "Misleading" };
  if (score <= 69) return { bg: "#16a34a", text: "#ffffff", label: "Trusted" };
  if (score <= 99) return { bg: "#15803d", text: "#ffffff", label: "Highly Trusted" };
  return { bg: "#CFB53B", text: "#3a2e00", label: "Certified GoodShare" };
}

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function PickReviews({ recommenderId, recommendationId }: Props) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query ratings collection filtered by this pick
    const { collection: col, query: q, where, orderBy: ob, onSnapshot: snap } = require("firebase/firestore");
    const ratingsRef = col(db, "ratings");
    const rq = q(ratingsRef, where("recommendationId", "==", recommendationId), ob("createdAt", "desc"));
    
    const unsubscribe = snap(rq, (snapshot: any) => {
      const data: Rating[] = snapshot.docs.map((d: any) => ({
        id: d.id,
        ...d.data(),
      }));
      setRatings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [recommendationId]);

  if (loading) {
    return (
      <div className="mt-6">
        <div className="mb-4 h-5 w-32 animate-pulse rounded bg-gray-100" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Verified Reviews
          </p>
          <h2 className="text-lg font-bold text-gray-900">
            {ratings.length === 0
              ? "No reviews yet"
              : `${ratings.length} review${ratings.length === 1 ? "" : "s"} from buyers`}
          </h2>
        </div>
        {ratings.length > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold">
              {Math.round(ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length)}
              <span className="text-sm font-normal text-gray-400">/100</span>
            </p>
            <p className="text-xs text-gray-400">avg score</p>
          </div>
        )}
      </div>

      {ratings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-8 text-center">
          <p className="text-sm text-gray-400">
            No reviews yet. Be the first to rate this pick after buying it.
          </p>
          <a
            href={`/rate/${recommenderId}/${recommendationId}`}
            className="mt-4 inline-block rounded-xl bg-black px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-80"
          >
            Rate this pick →
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {ratings.map((rating) => {
            const scoreStyle = getScoreStyle(rating.score);
            return (
              <div key={rating.id} className="rounded-2xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <a href={`/recommenders/${rating.reviewerId}`}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200 transition">
                        {getInitials(rating.reviewerName)}
                      </div>
                    </a>
                    <div>
                      <a
                        href={`/recommenders/${rating.reviewerId}`}
                        className="text-sm font-semibold text-gray-900 hover:underline"
                      >
                        {rating.reviewerName}
                      </a>
                      <div className="mt-0.5 flex items-center gap-2">
                        {rating.verified && (
                          <span className="text-xs font-medium text-green-600">
                            ✓ Verified purchase
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {rating.createdAt?.seconds ? timeAgo(rating.createdAt.seconds) : "recently"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-3 py-1 text-xs font-bold"
                    style={{ backgroundColor: scoreStyle.bg, color: scoreStyle.text }}
                  >
                    {rating.score}/100 · {scoreStyle.label}
                  </span>
                </div>
                {rating.note && (
                  <p className="mt-3 text-sm leading-6 text-gray-700 border-t border-gray-100 pt-3">
                    {rating.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}