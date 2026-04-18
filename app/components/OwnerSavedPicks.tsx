"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import SavedPicksList from "./SavedPicksList";

type Props = {
  profileUserId?: string;
};

export default function OwnerSavedPicks({ profileUserId }: Props) {
  const [isOwner, setIsOwner] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsOwner(!!user && user.uid === profileUserId);
    });
    return () => unsubscribe();
  }, [profileUserId]);

  if (!isOwner || !profileUserId) return null;

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Saved Picks</h2>
          <p className="text-xs text-gray-400">Only visible to you</p>
        </div>
        <button
          onClick={() => setShowSaved((prev) => !prev)}
          className="text-xs font-medium text-gray-500 underline underline-offset-4 hover:text-gray-800"
        >
          {showSaved ? "Hide" : "Show"}
        </button>
      </div>

      {showSaved && <SavedPicksList userId={profileUserId} />}
    </section>
  );
}