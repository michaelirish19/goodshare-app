"use client";

import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Logged in!");
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
      alert("Could not log in.");
    }
  };

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-md">
        <a
          href="/"
          className="mb-6 inline-block text-sm text-gray-600 underline"
        >
          ← Back to Home
        </a>

        <h1 className="mb-6 text-3xl font-bold">Log In</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            className="w-full rounded border p-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            className="w-full rounded border p-2"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-white"
          >
            Log In
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600">
          Need an account?{" "}
          <a href="/signup" className="underline">
            Sign up
          </a>
        </p>
      </div>
    </main>
  );
}