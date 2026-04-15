"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";

type Props = {
  recommenderId: string;
  recommendationId: string;
  recommenderName: string;
  recommenderRole?: string;
  recommendationTitle: string;
  category?: string;
};

export default function GoRedirectClient({
  recommenderId,
  recommendationId,
  recommenderName,
  recommenderRole,
  recommendationTitle,
  category,
}: Props) {
  const [countdown, setCountdown] = useState(6);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const targetHref = `/out/${recommenderId}/${recommendationId}`;
  const signupHref = `/signup?ref=${recommenderId}&pick=${recommendationId}`;
  const loginHref = `/login?ref=${recommenderId}&pick=${recommendationId}`;
  const rateHref = `/rate/${recommenderId}/${recommendationId}`;

  const initials = recommenderName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const redirectTimer = window.setTimeout(() => {
      window.location.href = targetHref;
    }, 6000);

    const countdownTimer = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      window.clearTimeout(redirectTimer);
      window.clearInterval(countdownTimer);
    };
  }, [targetHref]);

  const isLoggedIn = !authLoading && !!user;
  const isOwnProfile = isLoggedIn && user?.uid === recommenderId;

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-2xl">

        <a
          href={`/recommenders/${recommenderId}`}
          className="mb-8 inline-block text-sm text-gray-500 transition hover:text-black"
        >
          ← Back to {recommenderName}&apos;s picks
        </a>

        <section className="rounded-2xl border border-gray-200 p-6 shadow-sm">

          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Heading to your pick
          </p>

          <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight">
            {recommendationTitle}
          </h1>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-600">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium">{recommenderName}</p>
              {recommenderRole && (
                <p className="text-xs text-gray-500">{recommenderRole}</p>
              )}
            </div>
          </div>

          {category && (
            <div className="mt-4">
              <span className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
                {category}
              </span>
            </div>
          )}

          <div className="mt-6">
            <p className="text-sm text-gray-600">
              {countdown > 0
                ? `Redirecting in ${countdown} second${countdown === 1 ? "" : "s"}...`
                : "Redirecting now..."}
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-black transition-all duration-1000"
                style={{ width: `${(countdown / 6) * 100}%` }}
              />
            </div>
          </div>

          <div className="mt-4">
            <a
              href={targetHref}
              className="text-sm font-medium text-gray-500 underline underline-offset-4 transition hover:text-black"
            >
              Go now →
            </a>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">

            {/* ── Logged in — show rate CTA directly ── */}
            {isLoggedIn && !isOwnProfile && (
              <>
                <p className="text-sm font-medium text-gray-800">
                  Bought it? Rate {recommenderName} now.
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Your rating helps others trust the right people — and rewards sharers who give great picks.
                </p>
                <div className="mt-4">
                  <a
                    href={rateHref}
                    className="block w-full rounded-xl bg-black px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Rate this pick →
                  </a>
                </div>
              </>
            )}

            {/* ── Logged in — viewing own pick ── */}
            {isLoggedIn && isOwnProfile && (
              <>
                <p className="text-sm font-medium text-gray-800">
                  This is your pick.
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Share it with someone and ask them to rate you after they buy it.
                </p>
                <div className="mt-4">
                  <a
                    href={`/recommenders/${recommenderId}`}
                    className="block w-full rounded-xl border border-gray-300 px-5 py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Back to your profile
                  </a>
                </div>
              </>
            )}

            {/* ── Not logged in — show signup/login ── */}
            {!isLoggedIn && !authLoading && (
              <>
                <p className="text-sm font-medium text-gray-800">
                  Bought it? Come back and rate {recommenderName}.
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Your rating helps others trust the right people — and rewards sharers who give great picks.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={signupHref}
                    className="flex-1 rounded-xl bg-black px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Create a free account to rate
                  </a>
                  <a
                    href={loginHref}
                    className="flex-1 rounded-xl border border-gray-300 px-5 py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Log in
                  </a>
                </div>
                <div className="mt-3">
                  <a
                    href={rateHref}
                    className="block w-full rounded-xl border border-gray-200 px-5 py-3 text-center text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                  >
                    Already have an account? Rate this pick →
                  </a>
                </div>
              </>
            )}

            {/* ── Auth still loading — show nothing yet ── */}
            {authLoading && (
              <div className="h-16" />
            )}

          </div>

        </section>

        <p className="mt-6 text-center text-xs text-gray-400">
          GoodShare — recommendations from real people.
        </p>

      </div>
    </main>
  );
}