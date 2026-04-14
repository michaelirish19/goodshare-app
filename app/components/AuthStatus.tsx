"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function AuthStatus() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (
        currentUser &&
        (currentUser.emailVerified ||
          currentUser.providerData.some((p) => p.providerId === "google.com"))
      ) {
        setUser(currentUser);

        // Update lastActiveAt whenever a verified user loads the app
        try {
          const profileRef = doc(db, "recommenders", currentUser.uid);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            await updateDoc(profileRef, {
              lastActiveAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.error("Failed to update lastActiveAt:", err);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <span className="text-sm text-gray-600">
        {user.displayName || user.email}
      </span>

      <Link
        href={`/recommenders/${user.uid}`}
        className="rounded-xl border border-gray-300 px-3 py-1.5 text-sm font-medium transition hover:bg-gray-50"
      >
        My Profile
      </Link>

      <button
        onClick={handleLogout}
        className="rounded-xl border border-gray-300 px-3 py-1.5 text-sm font-medium transition hover:bg-gray-50"
      >
        Log Out
      </button>
    </div>
  );
}