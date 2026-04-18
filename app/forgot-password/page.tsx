"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        const code = (err as { code?: string }).code;
        if (code === "auth/user-not-found" || code === "auth/invalid-email") {
          // Don't reveal whether email exists — just show success
          setSent(true);
        } else if (code === "auth/too-many-requests") {
          setError("Too many attempts. Please wait a few minutes and try again.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-md">

        <a href="/login" className="mb-8 inline-block text-sm text-gray-500 transition hover:text-black">
          ← Back to log in
        </a>

        {sent ? (
          <div className="rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
              ✓
            </div>
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              If an account exists for <strong>{email}</strong>, we sent a password reset link. Check your inbox and spam folder.
            </p>
            <a
              href="/login"
              className="mt-6 inline-block rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-80"
            >
              Back to log in
            </a>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Account recovery
              </p>
              <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
              <p className="mt-2 text-sm text-gray-500">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-gray-900"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-80 disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Remembered it?{" "}
              <a href="/login" className="font-medium text-black underline underline-offset-4">
                Log in
              </a>
            </p>
          </>
        )}

      </div>
    </main>
  );
}