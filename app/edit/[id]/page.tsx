"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function EditRecommendationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params.id as string;
  const recommenderIdFromQuery = searchParams.get("recommenderId") || "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [category, setCategory] = useState("");
  const [recommenderId, setRecommenderId] = useState(recommenderIdFromQuery);
  const [loading, setLoading] = useState(true);

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
          setLink(data.link || "");
          setCategory(data.category || "");
          setRecommenderId(recommenderIdFromQuery);
        }
      } catch (error) {
        console.error("Error loading recommendation:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, recommenderIdFromQuery]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recommenderId) {
      alert("Missing recommender ID.");
      return;
    }

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
        link: link.trim(),
        category: category.trim(),
      });

      router.push(`/recommenders/${recommenderId}`);
    } catch (error) {
      console.error("Error updating recommendation:", error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-black">
        <div className="mx-auto max-w-xl">
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-xl">
        <a
          href={recommenderId ? `/recommenders/${recommenderId}` : "/"}
          className="mb-6 inline-block text-sm text-gray-600 underline"
        >
          ← Back to Profile
        </a>

        <h1 className="mb-6 text-3xl font-bold">Edit Recommendation</h1>

        <form onSubmit={handleUpdate} className="space-y-4">
          <input
            className="w-full rounded border p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
          />

          <textarea
            className="w-full rounded border p-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            required
          />

          <input
            className="w-full rounded border p-2"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Product Link"
            required
          />

          <input
            className="w-full rounded border p-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            required
          />

          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-white"
          >
            Save Changes
          </button>
        </form>
      </div>
    </main>
  );
}