"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

type ReferralData = {
  recommenderId: string;
  recommendationId: string;
  recommenderName: string;
  pickTitle: string;
  savedAt: number;
};

const REFERRAL_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function ReferralBanner() {
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoggedIn(!!user);
      setLoading(false);

      // Clear referral if logged in
      if (user) {
        try {
          localStorage.removeItem("goodshare_referral");
        } catch {
          // ignore
        }
        setReferral(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading || loggedIn) return;

    // Read referral from localStorage
    try {
      const stored = localStorage.getItem("goodshare_referral");
      if (!stored) return;

      const parsed: ReferralData = JSON.parse(stored);

      // Check if referral has expired
      if (Date.now() - parsed.savedAt > REFERRAL_EXPIRY_MS) {
        localStorage.removeItem("goodshare_referral");
        return;
      }

      setReferral(parsed);
    } catch {
      // ignore malformed data
    }
  }, [loading, loggedIn]);

  // Check session dismissal
  useEffect(() => {
    try {
      const wasDismissed = sessionStorage.getItem("goodshare_referral_dismissed");
      if (wasDismissed) setDismissed(true);
    } catch {
      // ignore
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem("goodshare_referral_dismissed", "true");
    } catch {
      // ignore
    }
  }

  if (loading || loggedIn || !referral || dismissed) return null;

  const signupHref = `/signup?ref=${referral.recommenderId}&pick=${referral.recommendationId}`;
  const firstName = referral.recommenderName.split(" ")[0];

  return (
    <div className="fixed bottom-20 left-0 right-0 z-30 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-gray-900">
              You came from {firstName}&apos;s pick
            </p>
            <p className="truncate text-xs text-gray-500">
              {referral.pickTitle}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={signupHref}
              className="rounded-xl bg-black px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-80"
            >
              Join to rate
            </a>
            <button
              onClick={handleDismiss}
              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}