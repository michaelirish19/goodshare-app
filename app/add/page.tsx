"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../firebase";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";

type Recommender = {
  name: string;
  role: string;
  categories: string;
  userId?: string;
};

function AddRecommendationPageContent() {
  const searchParams = useSearchParams();
  const recommenderId = searchParams.get("recommenderId");
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadRecommender = async () => {
      if (!recommenderId) {
        setLoadingCategories(false);
        return;
      }

      try {
        const recommenderRef = doc(db, "recommenders", recommenderId);
        const recommenderSnap = await getDoc(recommenderRef);

        if (recommenderSnap.exists()) {
          const data = recommenderSnap.data() as Recommender;

          const parsedCategories =
            data.categories
              ?.split("•")
              .map((item) => item.trim())
              .filter(Boolean) ?? [];

          setExistingCategories(parsedCategories);
        }
      } catch (error) {
        console.error("Error loading recommender categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadRecommender();
  }, [recommenderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recommenderId) {
      alert("Missing recommender ID");
      return;
    }

    const finalCategory = newCategory.trim() || category.trim();

    if (!title.trim() || !description.trim() || !link.trim()) {
      alert("Please complete all fields.");
      return;
    }

    if (!finalCategory) {
      alert("Please choose or enter a category");
      return;
    }

    setIsSaving(true);

    try {
      await addDoc(
        collection(db, "recommenders", recommenderId, "recommendations"),
        {
          title: title.trim(),
          description: description.trim(),
          link: link.trim(),
          category: finalCategory,
        }
      );

      const normalizedExisting = existingCategories.map((item) =>
        item.trim().toLowerCase()
      );

      const isNewCategory =
        !!newCategory.trim() &&
        !normalizedExisting.includes(newCategory.trim().toLowerCase());

      if (isNewCategory) {
        const updatedCategories = [...existingCategories, newCategory.trim()];

        await updateDoc(doc(db, "recommenders", recommenderId), {
          categories: updatedCategories.join(" • "),
        });
      }

      router.push(`/recommenders/${recommenderId}`);
    } catch (error) {
      console.error("Error adding recommendation:", error);
      alert("Could not add recommendation.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-xl">
        <a
          href={recommenderId ? `/recommenders/${recommenderId}` : "/"}
          className="mb-6 inline-block text-sm text-gray-600 underline"
        >
          ← Back to Profile
        </a>

        <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold">Add Recommendation</h1>
          <p className="mb-6 text-sm text-gray-600">
            Add something you genuinely stand behind, along with the reason you
            recommend it.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Title
              </label>
              <input
                id="title"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                placeholder="TheraGun Mini"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Why I Recommend This
              </label>
              <textarea
                id="description"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                placeholder="Explain why you recommend this. What makes it useful or worth using?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div>
              <label
                htmlFor="link"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Product Link
              </label>
              <input
                id="link"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                placeholder="https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Choose Existing Category
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loadingCategories || existingCategories.length === 0}
              >
                <option value="">
                  {loadingCategories
                    ? "Loading categories..."
                    : existingCategories.length > 0
                    ? "Select a category"
                    : "No categories found"}
                </option>
                {existingCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="newCategory"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Or Enter a New Category
              </label>
              <input
                id="newCategory"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                placeholder="New category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Adding..." : "Add Recommendation"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function AddRecommendationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white px-6 py-10 text-black">
          <div className="mx-auto max-w-xl">Loading...</div>
        </main>
      }
    >
      <AddRecommendationPageContent />
    </Suspense>
  );
}