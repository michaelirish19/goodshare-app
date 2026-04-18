"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { auth, db } from "../firebase";

type Props = {
  profileUserId: string;
  profileName: string;
};

export default function FollowButton({ profileUserId, profileName }: Props) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUserId(user?.uid ?? null);

      if (!user || user.uid === profileUserId) {
        setChecking(false);
        return;
      }

      try {
        const ref = doc(db, "recommenders", user.uid, "following", profileUserId);
        const snap = await getDoc(ref);
        setIsFollowing(snap.exists());
      } catch {
        // ignore
      } finally {
        setChecking(false);
      }
    });
    return () => unsubscribe();
  }, [profileUserId]);

  // Don't show if not logged in, own profile, or still checking
  if (!currentUserId || currentUserId === profileUserId || checking) return null;

  async function handleToggle() {
    if (!currentUserId || loading) return;
    setLoading(true);

    try {
      const followingRef = doc(db, "recommenders", currentUserId, "following", profileUserId);
      const followerRef = doc(db, "recommenders", profileUserId, "followers", currentUserId);

      if (isFollowing) {
        // Unfollow
        await deleteDoc(followingRef);
        await deleteDoc(followerRef);
        await updateDoc(doc(db, "recommenders", currentUserId), {
          followingCount: increment(-1),
        }).catch(() => {});
        await updateDoc(doc(db, "recommenders", profileUserId), {
          followerCount: increment(-1),
        }).catch(() => {});
        setIsFollowing(false);
      } else {
        // Follow
        const followData = { followedAt: serverTimestamp() };
        await setDoc(followingRef, followData);
        await setDoc(followerRef, followData);
        await updateDoc(doc(db, "recommenders", currentUserId), {
          followingCount: increment(1),
        }).catch(() => {});
        await updateDoc(doc(db, "recommenders", profileUserId), {
          followerCount: increment(1),
        }).catch(() => {});
        setIsFollowing(true);
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
        isFollowing
          ? "border border-gray-300 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          : "bg-black text-white hover:opacity-80"
      }`}
    >
      {loading ? "…" : isFollowing ? "Following" : "Follow"}
    </button>
  );
}