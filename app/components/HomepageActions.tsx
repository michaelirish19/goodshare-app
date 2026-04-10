"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function HomepageActions() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setHasProfile(false);
        setCheckingUser(false);
        return;
      }

      try {
        const profileRef = doc(db, "recommenders", currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        setHasProfile(profileSnap.exists());
      } catch (error) {
        console.error("Error checking homepage profile state:", error);
        setHasProfile(false);
      } finally {
        setCheckingUser(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (checkingUser) {
    return <div className="h-10" />;
  }

  // ── Logged out: primary CTA ──
  if (!user) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link
          href="/signup"
          className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-80"
        >
          Get started — it&apos;s free
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Log in
        </Link>
      </div>
    );
  }

  // ── Logged in, no profile yet ──
  if (!hasProfile) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link
          href="/create-profile"
          className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-80"
        >
          Complete your profile
        </Link>
      </div>
    );
  }

  // ── Logged in with profile ──
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href={`/add?recommenderId=${user.uid}`}
        className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-80"
      >
        Add a recommendation
      </Link>
      <Link
        href={`/recommenders/${user.uid}`}
        className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        View my profile
      </Link>
      <Link
        href="/edit-profile"
        className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        Edit profile
      </Link>
    </div>
  );
}
