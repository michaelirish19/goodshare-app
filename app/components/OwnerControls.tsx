"use client";

import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

type OwnerControlsProps = {
  profileUserId?: string;
  recommenderId: string;
  recommendationId?: string;
  type: "profile" | "recommendation";
};

export default function OwnerControls({
  profileUserId,
  recommenderId,
  recommendationId,
  type,
}: OwnerControlsProps) {
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCanEdit(!!user && !!profileUserId && user.uid === profileUserId);
    });
    return () => unsubscribe();
  }, [profileUserId]);

  if (!canEdit) return null;

  if (type === "profile") {
    return (
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={`/add?recommenderId=${recommenderId}`}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-80"
        >
          Add a Pick
        </a>
        <a
          href="/edit-profile"
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Edit Profile
        </a>
      </div>
    );
  }

  if (!recommendationId) return null;

  return (
    <div className="mt-4 flex gap-3">
      <a
        href={`/edit/${recommendationId}?recommenderId=${recommenderId}`}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
      >
        Edit
      </a>
      <a
        href={`/delete/${recommendationId}?recommenderId=${recommenderId}`}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        Delete
      </a>
    </div>
  );
}