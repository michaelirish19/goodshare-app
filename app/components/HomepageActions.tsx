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
    return (
      <div className="mb-8 rounded-xl border border-gray-200 p-4">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <section className="mb-8 rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold">Join GoodShare</h2>
        <p className="mt-2 text-sm text-gray-600">
          Create an account to build your recommender profile and share what you
          trust.
        </p>

        <div className="mt-4 flex gap-3">
          <Link
            href="/signup"
            className="rounded bg-black px-4 py-2 text-sm text-white"
          >
            Sign Up
          </Link>

          <Link
            href="/login"
            className="rounded border border-gray-300 px-4 py-2 text-sm"
          >
            Log In
          </Link>
        </div>
      </section>
    );
  }

  if (!hasProfile) {
    return (
      <section className="mb-8 rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold">Complete Your Profile</h2>
        <p className="mt-2 text-sm text-gray-600">
          Finish setting up your recommender profile so people can discover your
          recommendations.
        </p>

        <Link
          href="/create-profile"
          className="mt-4 inline-block rounded bg-black px-4 py-2 text-sm text-white"
        >
          Complete Profile
        </Link>
      </section>
    );
  }

  return (
    <section className="mb-8 rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-semibold">Your Profile</h2>
      <p className="mt-2 text-sm text-gray-600">
        Manage your profile and recommendations.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/recommenders/${user.uid}`}
          className="rounded border border-gray-300 px-4 py-2 text-sm"
        >
          View My Profile
        </Link>

        <Link
          href="/edit-profile"
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          Edit Profile
        </Link>

        <Link
          href={`/add?recommenderId=${user.uid}`}
          className="rounded border border-gray-300 px-4 py-2 text-sm"
        >
          Add Recommendation
        </Link>
      </div>
    </section>
  );
}