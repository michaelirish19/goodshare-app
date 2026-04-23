"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const CATEGORY_OPTIONS = [
  "Product",
  "Tools",
  "Gear",
  "Clothes",
  "Accessories",
  "Other",
];

export default function EditRecommendationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params.id as string;
  const recommenderIdFromQuery = searchParams.get("recommenderId") || "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [recommenderId, setRecommenderId] = useState(recommenderIdFromQuery);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !recommenderIdFromQuery) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(
          db,
          "recommenders",
          recommenderIdFromQuery,
          "recommendations",
          id
        );

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title || "");
          setDescription(data.description || "");
          setUrl(data.url || data.link || "");
          setRecommenderId(recommenderIdFromQuery);

          // If the saved category matches a preset option use it
          // otherwise put it in the custom field
          const savedCategory = data.category || "";
          if (CATEGORY_OPTIONS.includes(savedCategory)) {
            setCategory(savedCategory);
          } else {
            setCustomCategory(savedCategory);
          }
        }
      } catch (error) {
        console.error("Error loading recommendation:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, recommenderIdFromQuery]);

  const finalCategory = customCategory.trim() || category;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!recommenderId) {
      setError("Missing recommender ID.");
      return;
    }

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSaving(true);

    try {
      const docRef = doc(
        db,
        "recommenders",
        recommenderId,
        "recommendations",
        id
      );

      await updateDoc(docRef, {
        title: title.trim(),
        description: description.trim(),
        url: url.trim(),
        category: finalCategory,
      });

      router.push(`/recommenders/${recommenderId}`);
    } catch (error) {
      console.error("Error updating recommendation:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-black">
        <div className="mx-auto max-w-xl">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-black sm:px-6">
      <div className="mx-auto max-w-xl">

        <a
          href={recommenderId ? `/recommenders/${recommenderId}` : "/"}
          className="mb-8 inline-block text-sm text-gray-500 transition hover:text-black"
        >
          ← Back to profile
        </a>

        <div className="mb-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Editing
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Edit Pick</h1>
        </div>

        <form onSubmit={handleUpdate} className="space-y-5">

          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Title <span className="text-gray-400">(required)</span>
            </label>
            <input
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-gray-900"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is this pick?"
            />
          </div>

          {/* URL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Link <span className="text-gray-400">(optional)</span>
            </label>
            <input
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-gray-900"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Category <span className="text-gray-400">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setCategory(option);
                    setCustomCategory("");
                  }}
                  className={
                    option === category && !customCategory.trim()
                      ? "inline-flex items-center rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white"
                      : "inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  }
                >
                  {option}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or type a custom category…"
              value={customCategory}
              onChange={(e) => {
                setCustomCategory(e.target.value);
                if (e.target.value.trim()) setCategory("");
              }}
              className="mt-3 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-gray-900"
            />
            {customCategory.trim() && (
              <p className="mt-1.5 text-xs text-gray-500">
                Will be saved as: <strong>{customCategory.trim()}</strong>
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Notes <span className="text-gray-400">(optional)</span>
            </label>
            <p className="mb-2 text-xs text-gray-500">
              This will appear on your pick as "Why you recommend this." Tell people what makes it worth it in your own words.
            </p>
            <textarea
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-gray-900"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. I've used this for 2 years and it's the best I've found. Changed how I work completely."
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/recommenders/${recommenderId}`)}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}