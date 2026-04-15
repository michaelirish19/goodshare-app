"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useRouter } from "next/navigation";

type Props = {
  variant?: "primary" | "secondary";
};

export default function JoinGoodShareButton({ variant = "primary" }: Props) {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoggedIn(!!user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading || loggedIn) return null;

  const baseStyles = "rounded-lg px-4 py-2 text-sm font-medium transition";
  const styles =
    variant === "primary"
      ? "bg-black text-white hover:opacity-90"
      : "border border-gray-300 text-gray-700 hover:bg-gray-100";

  return (
    <button
      onClick={() => router.push("/signup")}
      className={`${baseStyles} ${styles}`}
    >
      Join GoodShare
    </button>
  );
}