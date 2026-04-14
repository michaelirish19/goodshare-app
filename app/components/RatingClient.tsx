"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { auth, db } from "../firebase";

type Props = {
  recommenderId: string;
  recommendationId: string;
  recommenderName: string;
  recommenderRole?: string;
  pickTitle: string;
  pickCategory?: string;
};

type RatingLabel = {
  label: string;
  color: string;
  textColor: string;
};

function getRatingInfo(score: number): RatingLabel {
  if (score === 0) return { label: "Not Trusted", color: "#1a1a1a", textColor: "#ffffff" };
  if (score <= 30) return { label: "Misleading", color: "#dc2626", textColor: "#ffffff" };
  if (score <= 69) return { label: "Trusted", color: "#16a34a", textColor: "#ffffff" };
  if (score <= 99) return { label: "Highly Trusted", color: "#15803d", textColor: "#ffffff" };
  return { label: "Certified GoodShare ✓", color: "#CFB53B", textColor: "#3a2e00" };
}

function getBarColor(score: number): string {
  if (score === 0) return "#1a1a1a";
  if (score <= 30) return "#dc2626";
  if (score <= 69) return "#16a34a";
  if (score <= 99) return "#15803d";
  return "#CFB53B";
}

function getFrictionMultiplier(score: number): number {
  const distanceFromEdge = Math.min(score, 100 - score);
  if (distanceFromEdge > 30) return 1;
  if (distanceFromEdge > 20) return 0.7;
  if (distanceFromEdge > 10) return 0.4;
  if (distanceFromEdge > 5) return 0.2;
  return 0.08;
}

export default function RatingClient({
  recommenderId,
  recommendationId,
  recommenderName,
  recommenderRole,
  pickTitle,
  pickCategory,
}: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [hasClick, setHasClick] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  const [score, setScore] = useState(50);
  const [note, setNote] = useState("");
  const [confirmedPurchase, setConfirmedPurchase] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const fractionalScore = useRef(50);

  // Auth check + lastActiveAt update
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      // Update lastActiveAt on the recommender document if they have a profile
      if (currentUser) {
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
      }
    });
    return () => unsubscribe();
  }, []);

  // Eligibility check
  useEffect(() => {
    if (!user) {
      setCheckingEligibility(false);
      return;
    }

    async function check() {
      setCheckingEligibility(true);
      try {
        const ratingId = `${user!.uid}_${recommendationId}`;
        const ratingRef = doc(db, "ratings", ratingId);
        const ratingSnap = await getDoc(ratingRef);
        if (ratingSnap.exists()) {
          setAlreadyRated(true);
          setCheckingEligibility(false);
          return;
        }

        const { collection, query, where, getDocs } = await import("firebase/firestore");
        const clicksRef = collection(db, "outboundClicks");
        const q = query(
          clicksRef,
          where("recommendationId", "==", recommendationId),
          where("ip", "!=", null)
        );
        const clickSnap = await getDocs(q);
        setHasClick(!clickSnap.empty);
      } catch (err) {
        console.error("Eligibility check failed:", err);
        setHasClick(true);
      } finally {
        setCheckingEligibility(false);
      }
    }

    check();
  }, [user, recommendationId]);

  // Friction slider — mouse
  function handleMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    lastX.current = e.clientX;
    fractionalScore.current = score;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging.current || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    const percentDelta = (dx / rect.width) * 100;
    const friction = getFrictionMultiplier(Math.round(fractionalScore.current));
    fractionalScore.current = Math.min(100, Math.max(0, fractionalScore.current + percentDelta * friction));
    setScore(Math.round(fractionalScore.current));
  }

  function handleMouseUp() {
    isDragging.current = false;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }

  // Friction slider — touch
  function handleTouchStart(e: React.TouchEvent) {
    isDragging.current = true;
    lastX.current = e.touches[0].clientX;
    fractionalScore.current = score;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging.current || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const dx = e.touches[0].clientX - lastX.current;
    lastX.current = e.touches[0].clientX;
    const percentDelta = (dx / rect.width) * 100;
    const friction = getFrictionMultiplier(Math.round(fractionalScore.current));
    fractionalScore.current = Math.min(100, Math.max(0, fractionalScore.current + percentDelta * friction));
    setScore(Math.round(fractionalScore.current));
  }

  function handleTouchEnd() {
    isDragging.current = false;
  }

  async function handleSubmit() {
    setError("");

    if (!user) {
      setError("You need to be logged in to leave a rating.");
      return;
    }

    if (note.trim().length < 20) {
      setError("Please write at least 20 characters in your note.");
      return;
    }

    if (!confirmedPurchase) {
      setError("Please confirm you purchased this product before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const ratingId = `${user.uid}_${recommendationId}`;
      const ratingRef = doc(db, "ratings", ratingId);

      await setDoc(ratingRef, {
        recommenderId,
        recommendationId,
        reviewerId: user.uid,
        reviewerName: user.displayName || user.email || "Anonymous",
        score,
        note: note.trim(),
        verified: confirmedPurchase,
        hasClick,
        createdAt: serverTimestamp(),
      });

      const recommendationRef = doc(
        db,
        "recommenders",
        recommenderId,
        "recommendations",
        recommendationId
      );
      await updateDoc(recommendationRef, {
        totalRatingScore: increment(score),
        pickRatings: increment(1),
      });

      const recommenderRef = doc(db, "recommenders", recommenderId);
      await updateDoc(recommenderRef, {
        totalRatingScore: increment(score),
        totalRatings: increment(1),
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Rating submission failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const ratingInfo = getRatingInfo(score);
  const barColor = getBarColor(score);

  const initials = recommenderName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // ── Loading ──
  if (authLoading || checkingEligibility) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-black">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-gray-500">Checking eligibility...</p>
        </div>
      </main>
    );
  }

  // ── Not logged in ──
  if (!user) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-black">
        <div className="mx-auto max-w-2xl">
          <a href={`/recommenders/${recommenderId}`} className="mb-8 inline-block text-sm text-gray-500 hover:text-black">
            ← Back to {recommenderName}&apos;s picks
          </a>
          <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h1 className="text-2xl font-bold">Sign in to leave a rating</h1>
            <p className="mt-2 text-sm text-gray-600">
              You need a GoodShare account to rate a pick.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="/signup" className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-80">
                Create account
              </a>
              <a href="/login" className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Log in
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Already rated ──
  if (alreadyRated) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-black">
        <div className="mx-auto max-w-2xl">
          <a href={`/recommenders/${recommenderId}`} className="mb-8 inline-block text-sm text-gray-500 hover:text-black">
            ← Back to {recommenderName}&apos;s picks
          </a>
          <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h1 className="text-2xl font-bold">Already rated</h1>
            <p className="mt-2 text-sm text-gray-600">
              You&apos;ve already rated this pick. Each pick can only be rated once.
            </p>
            <a href={`/recommenders/${recommenderId}`} className="mt-6 inline-block rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-80">
              View other picks
            </a>
          </div>
        </div>
      </main>
    );
  }

  // ── Submitted successfully ──
  if (submitted) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-black">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
              ✓
            </div>
            <h1 className="text-2xl font-bold">Rating submitted</h1>
            <p className="mt-2 text-sm text-gray-600">
              Thanks for rating {recommenderName}&apos;s pick. Your rating helps build trust in GoodShare.
            </p>
            <div
              className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: ratingInfo.color, color: ratingInfo.textColor }}
            >
              {score}/100 — {ratingInfo.label}
            </div>
            {confirmedPurchase && (
              <p className="mt-3 text-xs text-green-600 font-medium">
                ✓ Verified purchase
              </p>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <a href={`/recommenders/${recommenderId}`} className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-80">
                Back to {recommenderName}&apos;s picks
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Main rating UI ──
  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-2xl">

        <a href={`/recommenders/${recommenderId}`} className="mb-8 inline-block text-sm text-gray-500 transition hover:text-black">
          ← Back to {recommenderName}&apos;s picks
        </a>

        <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">

          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Rate this pick
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight">{pickTitle}</h1>

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

          {pickCategory && (
            <div className="mt-3">
              <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
                {pickCategory}
              </span>
            </div>
          )}

          <div className="my-6 border-t border-gray-100" />

          {/* Purchase confirmation checkbox */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={confirmedPurchase}
                onChange={(e) => setConfirmedPurchase(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-black"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">
                  I confirm I purchased this product based on this recommendation
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Your rating will be marked as a verified purchase. This keeps GoodShare trustworthy for everyone.
                </p>
              </div>
            </label>
          </div>

          {/* Score display */}
          <div className="mb-6 flex items-center justify-between">
            <span className="text-4xl font-bold tabular-nums">{score}</span>
            <span
              className="rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300"
              style={{ backgroundColor: ratingInfo.color, color: ratingInfo.textColor }}
            >
              {ratingInfo.label}
            </span>
          </div>

          {/* Friction slider */}
          <div className="mb-2 flex justify-between text-xs text-gray-400">
            <span>Not Trusted</span>
            <span>Certified GoodShare</span>
          </div>

          <div
            ref={sliderRef}
            className="relative h-10 cursor-grab select-none rounded-full bg-gray-100 active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-colors duration-300"
              style={{ width: `${score}%`, backgroundColor: barColor }}
            />
            <div
              className="absolute top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow-md transition-colors duration-300"
              style={{ left: `${score}%`, boxShadow: `0 0 0 3px ${barColor}` }}
            />
          </div>

          <p className="mt-3 text-center text-xs text-gray-400">
            Keep dragging to reach the end. Slider has built-in friction.
          </p>

          {/* Note field */}
          <div className="mt-8">
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Why did you give this rating?
            </label>
            <textarea
              rows={4}
              placeholder="Tell others what you experienced. Min 20 characters."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
            />
            <p className={`mt-1 text-right text-xs ${note.trim().length < 20 ? "text-gray-400" : "text-green-600"}`}>
              {note.trim().length} / 20 min
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || note.trim().length < 20 || !confirmedPurchase}
            className="mt-6 w-full rounded-2xl bg-black px-6 py-4 text-sm font-semibold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? "Submitting..." : `Submit rating — ${score}/100`}
          </button>

          <p className="mt-4 text-center text-xs text-gray-400">
            Ratings are permanent and cannot be changed after 24 hours.
          </p>

        </div>
      </div>
    </main>
  );
}