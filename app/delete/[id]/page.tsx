"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function DeleteRecommendationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params.id as string;
  const recommenderIdFromQuery = searchParams.get("recommenderId") || "";

  const [title, setTitle] = useState("");
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
          setRecommenderId(recommenderIdFromQuery);
        }
      } catch (error) {
        console.error("Error loading recommendation for delete:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, recommenderIdFromQuery]);

  const handleDelete = async () => {
    if (!recommenderId) {
      alert("Missing recommender ID.");
      return;
    }

    try {
      await deleteDoc(
        doc(db, "recommenders", recommenderId, "recommendations", id)
      );

      router.push(`/recommenders/${recommenderId}`);
    } catch (error) {
      console.error("Error deleting recommendation:", error);
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

        <h1 className="mb-4 text-3xl font-bold">Confirm Delete</h1>

        <p className="mb-6 text-sm text-gray-700">
          This action cannot be undone. Are you sure you want to delete:
        </p>

        <div className="mb-6 rounded-xl border border-gray-200 p-4">
          <p className="font-semibold">{title || "This recommendation"}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleDelete}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Yes, Delete
          </button>

          <a
            href={recommenderId ? `/recommenders/${recommenderId}` : "/"}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Cancel
          </a>
        </div>
      </div>
    </main>
  );
}