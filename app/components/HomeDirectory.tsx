"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

type Recommender = {
  id: string;
  name: string;
  role: string;
  categories: string;
  description?: string;
};

function HomeDirectoryContent() {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category") || "All";

  const [recommenders, setRecommenders] = useState<Recommender[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "recommenders"), (snapshot) => {
      const nextRecommenders: Recommender[] = snapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Recommender, "id">;
        return { id: doc.id, ...data };
      });
      setRecommenders(nextRecommenders);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setSelectedCategory(urlCategory);
  }, [urlCategory]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        recommenders.flatMap((recommender) =>
          recommender.categories
            .split("•")
            .map((category) => category.trim())
            .filter(Boolean)
        )
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [recommenders]);

  const visibleCategories = showAllCategories ? categories : categories.slice(0, 10);

  const filteredRecommenders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return recommenders.filter((recommender) => {
      const parsedCategories = recommender.categories
        .split("•")
        .map((category) => category.trim())
        .filter(Boolean);

      const matchesCategory =
        selectedCategory === "All" || parsedCategories.includes(selectedCategory);

      const matchesSearch =
        normalizedSearch === "" ||
        recommender.name.toLowerCase().includes(normalizedSearch) ||
        recommender.role.toLowerCase().includes(normalizedSearch) ||
        recommender.description?.toLowerCase().includes(normalizedSearch) ||
        parsedCategories.some((category) =>
          category.toLowerCase().includes(normalizedSearch)
        );

      return matchesCategory && matchesSearch;
    });
  }, [recommenders, selectedCategory, searchTerm]);

  if (loading) {
    return <div className="mt-6 text-sm text-gray-500">Loading...</div>;
  }

  return (
    <>
      {/* ── Browse by Category ── */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Browse by Category</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Tap a category to see all picks from the community
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => { setSelectedCategory("All"); setSearchTerm(""); }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              selectedCategory === "All"
                ? "bg-black text-white"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            All Sharers
          </button>

          {visibleCategories.map((category) => (
            <div key={category} className="flex items-center gap-1">
              <button
                onClick={() => { setSelectedCategory(category); setSearchTerm(""); }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === category
                    ? "bg-black text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {category}
              </button>
              {/* Link to full category picks page */}
              <a
                href={`/categories/${encodeURIComponent(category)}`}
                className="rounded-full border border-gray-200 px-2 py-2 text-xs text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
                title={`Browse all ${category} picks`}
              >
                →
              </a>
            </div>
          ))}
        </div>

        {categories.length > 10 && (
          <button
            type="button"
            onClick={() => setShowAllCategories((prev) => !prev)}
            className="mt-3 text-sm text-gray-500 underline underline-offset-4 hover:text-black"
          >
            {showAllCategories ? "Show less" : `Show all ${categories.length} categories`}
          </button>
        )}
      </section>

      {/* ── All Sharers ── */}
      <section className="mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {selectedCategory === "All" ? "All Sharers" : `Sharers in ${selectedCategory}`}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {selectedCategory === "All"
                ? `${filteredRecommenders.length} sharer${filteredRecommenders.length === 1 ? "" : "s"}`
                : `${filteredRecommenders.length} sharer${filteredRecommenders.length === 1 ? "" : "s"} · `}
              {selectedCategory !== "All" && (
                <a
                  href={`/categories/${encodeURIComponent(selectedCategory)}`}
                  className="font-medium text-black underline underline-offset-4 hover:opacity-70"
                >
                  Browse all {selectedCategory} picks →
                </a>
              )}
            </p>
          </div>

          <div className="w-full sm:max-w-xs">
            <label className="mb-1 block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
                if (value.trim() !== "") setSelectedCategory("All");
              }}
              placeholder="Search name, role, category..."
              className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-900"
            />
          </div>
        </div>

        {filteredRecommenders.length > 0 ? (
          <div className="mt-6 space-y-4">
            {filteredRecommenders.map((recommender) => {
              const parsedCategories = recommender.categories
                .split("•")
                .map((category) => category.trim())
                .filter(Boolean);

              const initials = recommender.name
                .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

              return (
                <div
                  key={recommender.id}
                  className="rounded-2xl border border-gray-200 p-5 transition hover:border-gray-300 hover:shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-sm font-bold text-gray-600">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold">{recommender.name}</h3>
                      <p className="text-sm text-gray-500">{recommender.role}</p>

                      {recommender.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                          {recommender.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {parsedCategories.map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => { setSelectedCategory(category); setSearchTerm(""); }}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                              selectedCategory === category
                                ? "bg-black text-white"
                                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>

                      <a
                        href={`/recommenders/${recommender.id}`}
                        className="mt-4 inline-block rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white transition hover:opacity-80"
                      >
                        View Picks →
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center">
            <p className="text-sm text-gray-400">No sharers matched your filters.</p>
            <button
              onClick={() => { setSelectedCategory("All"); setSearchTerm(""); }}
              className="mt-4 inline-block rounded-xl bg-black px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-80"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </>
  );
}

export default function HomeDirectory() {
  return (
    <Suspense fallback={<div className="mt-6 text-sm text-gray-500">Loading...</div>}>
      <HomeDirectoryContent />
    </Suspense>
  );
}