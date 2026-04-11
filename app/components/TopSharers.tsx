"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

type Recommender = {
  id: string;
  name: string;
  role: string;
  categories: string;
  description?: string;
};

export default function TopSharers() {
  const [recommenders, setRecommenders] = useState<Recommender[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "recommenders"), (snapshot) => {
      const data: Recommender[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Recommender, "id">),
      }));
      setRecommenders(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const topSharers = recommenders.slice(0, 3);

  return (
    <section className="mb-10">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Featured
          </p>
          <h2 className="text-2xl font-bold">Top Sharers</h2>
        </div>
        <a
          href="/discover"
          className="text-sm font-medium text-gray-500 transition hover:text-black"
        >
          Browse all →
        </a>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Loading...</div>
      ) : topSharers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center">
          <p className="text-sm text-gray-400">No sharers yet. Be the first.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topSharers.map((recommender) => {
            const parsedCategories = recommender.categories
              .split("•")
              .map((c) => c.trim())
              .filter(Boolean);

            const initials = recommender.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <div
                key={recommender.id}
                className="rounded-2xl border border-gray-200 p-5 transition hover:border-gray-300 hover:shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-600">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{recommender.name}</h3>
                    <p className="text-sm text-gray-500">{recommender.role}</p>

                    {recommender.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                        {recommender.description}
                      </p>
                    )}

                    {parsedCategories.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {parsedCategories.map((category) => (
                          <span
                            key={category}
                            className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}

                    <a
                      href={`/recommenders/${recommender.id}`}
                      className="mt-4 inline-block rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white transition hover:opacity-80"
                    >
                      View Picks
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 text-center">
        <a
          href="/discover"
          className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Browse all sharers →
        </a>
      </div>
    </section>
  );
}