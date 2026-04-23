"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { useParams } from "next/navigation";

type Pick = {
  id: string;
  recommenderId: string;
  recommenderName: string;
  title: string;
  description: string;
  category: string;
  image?: string;
  siteName?: string;
};

export default function CategoryPage() {
  const params = useParams();
  const rawCategory = params.category as string;
  const category = decodeURIComponent(rawCategory);

  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPicks() {
      try {
        // Fetch all recommenders then get their picks in this category
        const recommendersSnap = await getDocs(collection(db, "recommenders"));

        const allPicks: Pick[] = [];

        await Promise.all(
          recommendersSnap.docs.map(async (recommenderDoc) => {
            const recommenderData = recommenderDoc.data();
            const recommenderCategories = recommenderData.categories || "";

            // Quick check — does this recommender have this category at all?
            const hasCategory = recommenderCategories
              .split("•")
              .map((c: string) => c.trim())
              .some((c: string) => c.toLowerCase() === category.toLowerCase());

            if (!hasCategory) return;

            const recsRef = collection(db, "recommenders", recommenderDoc.id, "recommendations");
            const recsQuery = query(recsRef, where("category", "==", category));
            const recsSnap = await getDocs(recsQuery);

            recsSnap.docs.forEach((recDoc) => {
              const data = recDoc.data();
              allPicks.push({
                id: recDoc.id,
                recommenderId: recommenderDoc.id,
                recommenderName: recommenderData.name || "Unknown",
                title: data.title || "Untitled",
                description: data.description || "",
                category: data.category || "",
                image: data.image || "",
                siteName: data.siteName || "",
              });
            });
          })
        );

        // Sort by recommender name then pick title
        allPicks.sort((a, b) => {
          if (a.recommenderName !== b.recommenderName) {
            return a.recommenderName.localeCompare(b.recommenderName);
          }
          return a.title.localeCompare(b.title);
        });

        setPicks(allPicks);
      } catch (err) {
        console.error("Failed to fetch category picks:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPicks();
  }, [category]);

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-black sm:px-6">
      <div className="mx-auto max-w-3xl">

        <a
          href="/discover"
          className="mb-8 inline-block text-sm text-gray-500 transition hover:text-black"
        >
          ← Back to Discover
        </a>

        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Browse by category
          </p>
          <h1 className="text-4xl font-bold tracking-tight">{category}</h1>
          {!loading && (
            <p className="mt-2 text-lg text-gray-500">
              {picks.length} pick{picks.length === 1 ? "" : "s"} from the community
            </p>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : picks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-16 text-center">
            <p className="text-sm text-gray-400">No picks in this category yet.</p>
            <a
              href="/discover"
              className="mt-4 inline-block rounded-xl bg-black px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-80"
            >
              Browse all sharers →
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {picks.map((pick) => (
              <div
                key={`${pick.recommenderId}-${pick.id}`}
                className="rounded-2xl border border-gray-200 p-5 transition hover:border-gray-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold leading-snug">
                      <a
                        href={`/recommenders/${pick.recommenderId}/recommendations/${pick.id}`}
                        className="hover:underline"
                      >
                        {pick.title}
                      </a>
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                      by{" "}
                      <a
                        href={`/recommenders/${pick.recommenderId}`}
                        className="font-medium text-gray-700 hover:underline"
                      >
                        {pick.recommenderName}
                      </a>
                      {pick.siteName && ` · ${pick.siteName}`}
                    </p>
                    {pick.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                        {pick.description}
                      </p>
                    )}
                  </div>
                  {pick.image && (
                    <img
                      src={pick.image}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`/go/${pick.recommenderId}/${pick.id}`}
                    className="rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white transition hover:opacity-80"
                  >
                    View →
                  </a>
                  <a
                    href={`/recommenders/${pick.recommenderId}/recommendations/${pick.id}`}
                    className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                  >
                    Details
                  </a>
                  <a
                    href={`/rate/${pick.recommenderId}/${pick.id}`}
                    className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                  >
                    Rate this pick
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}