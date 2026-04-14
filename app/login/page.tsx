"use client";

import { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setNeedsVerification(true);
        await auth.signOut();
        setLoading(false);
        return;
      }

      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        const code = (err as { code?: string }).code;
        if (
          code === "auth/invalid-credential" ||
          code === "auth/user-not-found" ||
          code === "auth/wrong-password"
        ) {
          setError("Incorrect email or password.");
        } else if (code === "auth/too-many-requests") {
          setError("Too many attempts. Please wait a few minutes and try again.");
        } else {
          setError("Could not log in. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        const code = (err as { code?: string }).code;
        if (code !== "auth/popup-closed-by-user") {
          setError("Could not sign in with Google. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await auth.signOut();
      setResendSent(true);
    } catch {
      setError("Could not resend verification email. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-md">

        <a href="/" className="mb-8 inline-block text-sm text-gray-500 transition hover:text-black">
          ← Back to GoodShare
        </a>

        <div className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Welcome back
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Log in</h1>
        </div>

        {/* Email not verified warning */}
        {needsVerification && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            <p className="font-medium">Please verify your email first.</p>
            <p className="mt-1 text-xs leading-5">
              Check your inbox for a verification link. Once verified, come back and log in.
            </p>
            {!resendSent ? (
              <button
                type="button"
                onClick={handleResendVerification}
                className="mt-3 text-xs font-medium underline underline-offset-4"
              >
                Resend verification email
              </button>
            ) : (
              <p className="mt-3 text-xs font-medium text-green-700">
                Verification email sent — check your inbox.
              </p>
            )}
          </div>
        )}

        {/* Google sign-in */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mb-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
            <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
            <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
            <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">or log in with email</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-gray-900"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="font-medium text-black underline underline-offset-4">
            Sign up
          </a>
        </p>

      </div>
    </main>
  );
}