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
      if (user && profileUserId && user.uid === profileUserId) {
        setCanEdit(true);
      } else {
        setCanEdit(false);
      }
    });

    return () => unsubscribe();
  }, [profileUserId]);

  if (!canEdit) return null;

  if (type === "profile") {
    return (
      <a
        href={`/add?recommenderId=${recommenderId}`}
        className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
      >
        Add a Pick
      </a>
    );
  }

  if (!recommendationId) return null;

  return (
    <div className="mt-4 flex gap-3">
      <a
        href={`/edit/${recommendationId}?recommenderId=${recommenderId}`}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
      >
        Edit
      </a>

      <a
        href={`/delete/${recommendationId}?recommenderId=${recommenderId}`}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600"
      >
        Delete
      </a>
    </div>
  );
}