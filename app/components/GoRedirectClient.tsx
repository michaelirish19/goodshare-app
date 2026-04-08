"use client";

import { useEffect, useState } from "react";

type Props = {
  recommenderId: string;
  recommendationId: string;
  recommenderName: string;
  recommendationTitle: string;
  category?: string;
};

export default function GoRedirectClient({
  recommenderId,
  recommendationId,
  recommenderName,
  recommendationTitle,
  category,
}: Props) {
  const [countdown, setCountdown] = useState(6);

  const targetHref = `/out/${recommenderId}/${recommendationId}`;

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

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-2xl">
        <section className="rounded-2xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Opening recommendation from GoodShare
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {recommendationTitle}
          </h1>

          <p className="mt-3 text-sm text-gray-700">
            Recommended by{" "}
            <a
              href={`/recommenders/${recommenderId}`}
              className="underline underline-offset-2 hover:text-black"
            >
              {recommenderName}
            </a>
          </p>

          {category ? (
            <div className="mt-4">
              <span className="inline-flex rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700">
                {category}
              </span>
            </div>
          ) : null}

          <div className="mt-6">
            <p className="text-sm text-gray-600">
              {countdown > 0
                ? `Redirecting to the product in ${countdown} second${
                    countdown === 1 ? "" : "s"
                  }...`
                : "Redirecting now..."}
            </p>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-black transition-all duration-1000"
                style={{ width: `${((6 - countdown) / 6) * 100}%` }}
              />
            </div>
          </div>

          <p className="mt-6 text-sm text-gray-700">
            Want to keep this recommendation?
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a
              href="/signup"
              className="flex-1 rounded-lg bg-black px-5 py-3 text-center text-base font-semibold text-white transition hover:opacity-90"
            >
              Save this + Join GoodShare
            </a>

            <a
              href={targetHref}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              View Product Now
            </a>
          </div>

          <p className="mt-6 text-xs leading-5 text-gray-500">
            GoodShare helps people discover products through recommendations
            from real users.
          </p>
        </section>
      </div>
    </main>
  );
}