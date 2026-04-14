"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

export default function AuthStatus() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Only show as logged in if email is verified
      // (Google accounts are always verified)
      if (currentUser && (currentUser.emailVerified || currentUser.providerData.some(p => p.providerId === "google.com"))) {
        setUser(currentUser);
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