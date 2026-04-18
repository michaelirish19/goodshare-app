"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

type Props = {
  recommenderId: string;
  recommendationId: string;
  pickTitle: string;
  recommenderName: string;
};

export default function BookmarkButton({
  recommenderId,
  recommendationId,
  pickTitle,
  recommenderName,
}: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUserId(user?.uid ?? null);
      if (!user) { setSaved(false); return; }

      // Check if already saved
      try {
        const ref = doc(db, "recommenders", user.uid, "saved", recommendationId);
        const snap = await getDoc(ref);
        setSaved(snap.exists());
      } catch {
        // ignore
      }
    });
    return () => unsubscribe();
  }, [recommendationId]);

  // Don't show to logged-out users
  if (!userId) return null;

  // Don't show on your own picks
  if (userId === recommenderId) return null;

  async function handleToggle() {
    if (!userId || loading) return;
    setLoading(true);

    try {
      const ref = doc(db, "recommenders", userId, "saved", recommendationId);
      if (saved) {
        await deleteDoc(ref);
        setSaved(false);
      } else {
        await setDoc(ref, {
          recommenderId,
          recommendationId,
          pickTitle,
          recommenderName,
          savedAt: serverTimestamp(),
        });
        setSaved(true);
      }
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      title={saved ? "Remove from saved" : "Save this pick"}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
        saved
          ? "border-black bg-black text-white hover:opacity-80"
          : "border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {saved ? "Saved" : "Save"}
    </button>
  );
}