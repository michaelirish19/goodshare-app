"use client";

import { useState } from "react";
import RecommendationCardQR from "./RecommendationCardQR";
import OwnerControls from "./OwnerControls";
import ShareButton from "./ShareButton";
import BookmarkButton from "./BookmarkButton";

type Recommendation = {
  id: string;
  title: string;
  description: string;
  link: string;
  category: string;
};

type Props = {
  recommendations: Recommendation[];
  recommenderId: string;
  profileUserId?: string;
  categories: string[];
  isOwner?: boolean;
  recommenderName?: string;
};

export default function RecommendationFilter({
  recommendations,
  recommenderId,
  profileUserId,
  categories,
  isOwner = false,
  recommenderName = "This sharer",
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filtered =
    selectedCategory === "All"
      ? recommendations
      : recommendations.filter(
          (r) => r.category?.trim() === selectedCategory
        );

  const grouped = filtered.reduce(
    (groups, item) => {
      const category = item.category?.trim() || "Uncategorized";
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
      return groups;
    },
    {} as Record<string, Recommendation[]>
  );

  const sortedEntries = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([category, items]) =>
        [
          category,
          [...items].sort((a, b) => a.title.localeCompare(b.title)),
        ] as const
    );

  if (recommendations.length === 0) {
    if (isOwner) {
      return (
        <section className="mt-8">
          <div className="rounded-2xl border-2 border-dashed border-gray-200 px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">📌</div>
            <h3 className="text-lg font-bold text-gray-900">Add your first pick</h3>
            <p className="mt-2 max-w-sm mx-auto text-sm leading-6 text-gray-500">
              Your picks are your recommendations — the products, tools, and resources you genuinely use and trust. Start building your reputation.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a href={`/add?recommenderId=${recommenderId}`}
                className="inline-flex items-center justify-center rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-80">
                Add your first pick →
              </a>
            </div>
            <div className="mt-8 border-t border-gray-100 pt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Here&apos;s how it works</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-6 text-left max-w-lg mx-auto">
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">1</span>
                  <p className="text-xs leading-5 text-gray-500">Paste a link to anything you recommend</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">2</span>
                  <p className="text-xs leading-5 text-gray-500">Tell people why you recommend it in your own words</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">3</span>
                  <p className="text-xs leading-5 text-gray-500">Share your profile link or QR code anywhere</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="mt-8">
        <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-400">{recommenderName} hasn&apos;t added any picks yet.</p>
          <p className="mt-1 text-xs text-gray-400">Check back soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Picks</h2>
        <span className="text-sm text-gray-400">{recommendations.length} total</span>
      </div>

      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              selectedCategory === "All" ? "bg-black text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedCategory === category ? "bg-black text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="space-y-8">
          {sortedEntries.map(([category, items]) => (
            <div key={category}>
              <div className="mb-3 flex items-center gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">{category}</h3>
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-xs text-gray-400">{items.length}</span>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-200 p-5 transition hover:border-gray-300 hover:shadow-sm"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h4 className="text-base font-semibold leading-snug">
                        <a
                          href={`/recommenders/${recommenderId}/recommendations/${item.id}`}
                          className="hover:underline"
                        >
                          {item.title}
                        </a>
                      </h4>
                      <a
                        href={`/go/${recommenderId}/${item.id}`}
                        className="shrink-0 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white transition hover:opacity-80"
                      >
                        View →
                      </a>
                    </div>

                    {item.description && (
                      <p className="mb-4 text-sm leading-6 text-gray-600">{item.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`/recommenders/${recommenderId}/recommendations/${item.id}`}
                        className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                      >
                        Details
                      </a>
                      <a
                        href={`/rate/${recommenderId}/${item.id}`}
                        className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                      >
                        Rate this pick
                      </a>
                      <BookmarkButton
                        recommenderId={recommenderId}
                        recommendationId={item.id}
                        pickTitle={item.title}
                        recommenderName={recommenderName}
                      />
                      <ShareButton
                        title={item.title}
                        url={`https://goodshare-app.vercel.app/go/${recommenderId}/${item.id}`}
                        note={item.description}
                        recommenderName={recommenderName}
                      />
                      <RecommendationCardQR
                        url={`https://goodshare-app.vercel.app/go/${recommenderId}/${item.id}`}
                      />
                      <OwnerControls
                        type="recommendation"
                        profileUserId={profileUserId}
                        recommenderId={recommenderId}
                        recommendationId={item.id}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center">
          <p className="text-sm font-medium text-gray-400">No picks in this category yet.</p>
          {isOwner && (
            <a
              href={`/add?recommenderId=${recommenderId}`}
              className="mt-4 inline-block rounded-xl bg-black px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-80"
            >
              Add a pick in this category →
            </a>
          )}
        </div>
      )}
    </section>
  );
}