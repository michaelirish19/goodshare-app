"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

type SavedPick = {
  id: string;
  recommenderId: string;
  recommendationId: string;
  pickTitle: string;
  recommenderName: string;
  savedAt: { seconds: number };
};

type Props = {
  userId: string;
};

export default function SavedPicksList({ userId }: Props) {
  const [picks, setPicks] = useState<SavedPick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = collection(db, "recommenders", userId, "saved");
    const q = query(ref, orderBy("savedAt", "desc"));

    const unsubscribe = onSnapshot(q, (snap) => {
      const data: SavedPick[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<SavedPick, "id">),
      }));
      setPicks(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  async function handleRemove(savedId: string) {
    try {
      await deleteDoc(doc(db, "recommenders", userId, "saved", savedId));
    } catch (err) {
      console.error("Failed to remove saved pick:", err);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (picks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
          🔖
        </div>
        <p className="text-sm font-medium text-gray-400">No saved picks yet.</p>
        <p className="mt-1 text-xs text-gray-400">
          Browse other sharers and tap Save on picks you want to remember.
        </p>
        <a
          href="/discover"
          className="mt-4 inline-block rounded-xl bg-black px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-80"
        >
          Discover sharers →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {picks.map((pick) => (
        <div
          key={pick.id}
          className="flex items-start justify-between gap-3 rounded-2xl border border-gray-200 p-4 transition hover:border-gray-300"
        >
          <div className="min-w-0 flex-1">
            <a
              href={`/recommenders/${pick.recommenderId}/recommendations/${pick.recommendationId}`}
              className="text-sm font-semibold text-gray-900 hover:underline"
            >
              {pick.pickTitle}
            </a>
            <p className="mt-0.5 text-xs text-gray-500">
              by {pick.recommenderName}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={`/go/${pick.recommenderId}/${pick.recommendationId}`}
              className="rounded-xl bg-black px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-80"
            >
              View →
            </a>
            <button
              type="button"
              onClick={() => handleRemove(pick.recommendationId)}
              className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-50"
              title="Remove from saved"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}