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
      <section className="mb-10">
        <h2 className="text-xl font-semibold">Browse Categories</h2>
        <p className="mb-2 mt-1 text-sm text-gray-500">Filter by category</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => { setSelectedCategory("All"); setSearchTerm(""); }}
            className={`rounded-full px-4 py-2 text-sm ${
              selectedCategory === "All"
                ? "bg-black text-white"
                : "border border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            All
          </button>

          {visibleCategories.map((category) => (
            <button
              key={category}
              onClick={() => { setSelectedCategory(category); setSearchTerm(""); }}
              className={`rounded-full px-4 py-2 text-sm ${
                selectedCategory === category
                  ? "bg-black text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {categories.length > 10 && (
          <button
            type="button"
            onClick={() => setShowAllCategories((prev) => !prev)}
            className="mt-3 text-sm text-gray-600 underline"
          >
            {showAllCategories ? "Show less" : "Show more"}
          </button>
        )}
      </section>

      <section className="mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">All Sharers</h2>
            <p className="mt-1 text-sm text-gray-500">
              {selectedCategory === "All"
                ? `${filteredRecommenders.length} shown`
                : `${filteredRecommenders.length} shown in ${selectedCategory}`}
            </p>
          </div>

          <div className="w-full sm:max-w-xs">
            <label className="mb-1 block text-sm font-medium">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
                if (value.trim() !== "") setSelectedCategory("All");
              }}
              placeholder="Search name, role, category..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
            />
          </div>
        </div>

        {filteredRecommenders.length > 0 ? (
          <div className="mt-4 space-y-4">
            {filteredRecommenders.map((recommender) => {
              const parsedCategories = recommender.categories
                .split("•")
                .map((category) => category.trim())
                .filter(Boolean);

              return (
                <div
                  key={recommender.id}
                  className="rounded-xl border border-gray-200 p-4 shadow-sm"
                >
                  <h3 className="text-lg font-semibold">{recommender.name}</h3>
                  <p className="text-sm text-gray-600">{recommender.role}</p>

                  {recommender.description && (
                    <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                      {recommender.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {parsedCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => { setSelectedCategory(category); setSearchTerm(""); }}
                        className={`rounded-full px-3 py-1 text-sm ${
                          selectedCategory === category
                            ? "bg-black text-white"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  <a
                    href={`/recommenders/${recommender.id}`}
                    className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    View Picks
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">No sharers matched your filters.</p>
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