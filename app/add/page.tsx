"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";;
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

type PreviewData = {
  title: string;
  description: string;
  image: string;
  siteName: string;
};

const CATEGORY_OPTIONS = [
  "Product",
  "Tools",
  "Gear",
  "Clothes",
  "Accessories",
  "Other",
];

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function normalizeUrl(input: string) {
  const trimmed = input.trim();

  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return `https://${trimmed}`;
}

function fallbackTitleFromUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const path = url.pathname
      .replace(/\/+/g, " ")
      .replace(/[-_]/g, " ")
      .trim();

    const hostname = url.hostname.replace(/^www\./, "");

    if (path && path !== "/") {
      const cleanedPath = path
        .split(" ")
        .filter(Boolean)
        .slice(0, 8)
        .join(" ");

      return cleanedPath.charAt(0).toUpperCase() + cleanedPath.slice(1);
    }

    return hostname;
  } catch {
    return "";
  }
}

function prettyHostname(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function inferCategory(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (
      host.includes("youtube.com") ||
      host.includes("youtu.be") ||
      host.includes("vimeo.com")
    ) {
      return "Video";
    }

    if (
  host.includes("homedepot.com") ||
  host.includes("lowes.com") ||
  host.includes("harborfreight.com")
) {
  return "Tools";
}

if (
  host.includes("rei.com") ||
  host.includes("backcountry.com") ||
  host.includes("cabelas.com")
) {
  return "Gear";
}

if (
  host.includes("nike.com") ||
  host.includes("adidas.com") ||
  host.includes("uniqlo.com")
) {
  return "Clothes";
}

if (
  host.includes("amazon.") ||
  host.includes("etsy.com") ||
  host.includes("ebay.com") ||
  host.includes("walmart.com") ||
  host.includes("target.com")
) {
  return "Product";
}

    if (
      host.includes("medium.com") ||
      host.includes("substack.com")
    ) {
      return "Article";
    }

    if (
      host.includes("spotify.com") ||
      host.includes("podcasts.apple.com")
    ) {
      return "Podcast";
    }

    return "Other";
  } catch {
    return "Other";
  }
}

export default function AddRecommendationPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const normalizedUrl = useMemo(() => normalizeUrl(url), [url]);
  const urlLooksValid = useMemo(
    () => !!normalizedUrl && isValidUrl(normalizedUrl),
    [normalizedUrl]
  );

  const derivedTitle = useMemo(() => {
    if (title.trim()) return title.trim();
    if (preview?.title?.trim()) return preview.title.trim();
    if (urlLooksValid) return fallbackTitleFromUrl(normalizedUrl);
    return "";
  }, [title, preview, urlLooksValid, normalizedUrl]);

  const hostname = useMemo(() => {
    if (!urlLooksValid) return "";
    return prettyHostname(normalizedUrl);
  }, [urlLooksValid, normalizedUrl]);

  async function fetchPreview(targetUrl: string) {
    if (!isValidUrl(targetUrl)) return;

    setIsFetchingPreview(true);

    try {
      /**
       * This page is ready for a future preview endpoint.
       * If /api/link-preview does not exist yet, the catch block falls back gracefully.
       *
       * Expected response shape:
       * {
       *   title?: string;
       *   description?: string;
       *   image?: string;
       *   siteName?: string;
       * }
       */
      const response = await fetch(
        `/api/link-preview?url=${encodeURIComponent(targetUrl)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Preview unavailable");
      }

      const data = await response.json();

      const nextPreview: PreviewData = {
        title: data?.title ?? "",
        description: data?.description ?? "",
        image: data?.image ?? "",
        siteName: data?.siteName ?? "",
      };

      setPreview(nextPreview);

      if (!title.trim() && nextPreview.title?.trim()) {
        setTitle(nextPreview.title.trim());
      }
    } catch {
      setPreview({
        title: fallbackTitleFromUrl(targetUrl),
        description: "",
        image: "",
        siteName: prettyHostname(targetUrl),
      });

      if (!title.trim()) {
        setTitle(fallbackTitleFromUrl(targetUrl));
      }
    } finally {
      setIsFetchingPreview(false);
    }
  }

  useEffect(() => {
    setError("");
    setSuccessMessage("");

    if (!urlLooksValid) {
      setPreview(null);
      setCategory("");
      return;
    }

    setCategory(inferCategory(normalizedUrl));

    const timer = setTimeout(() => {
      fetchPreview(normalizedUrl);
    }, 500);

    return () => clearTimeout(timer);
  }, [normalizedUrl, urlLooksValid]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (authLoading) {
      setError("Still checking your login. Try again in a moment.");
      return;
    }

    if (!userId) {
      setError("You need to be logged in to save a recommendation.");
      return;
    }

    if (!normalizedUrl || !isValidUrl(normalizedUrl)) {
      setError("Paste a valid link to save something.");
      return;
    }

    const finalTitle = derivedTitle.trim();

    if (!finalTitle) {
      setError("We could not generate a title yet. Add one manually and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "recommenders", userId, "recommendations"), {
        recommenderId: userId,
        userId,
        url: normalizedUrl,
        title: finalTitle,
        description: notes.trim(),
        category,
        siteName: preview?.siteName || hostname || "",
        image: preview?.image || "",
        createdAt: serverTimestamp(),
        outboundClicks: 0,
      });

      // Keep categories in sync on the recommender document
const recommenderRef = doc(db, "recommenders", userId);
const recommenderSnap = await getDoc(recommenderRef);
if (recommenderSnap.exists()) {
  const existing = recommenderSnap.data();
  const currentCategories = existing.categories
    ? existing.categories.split("•").map((c: string) => c.trim()).filter(Boolean)
    : [];
  if (category && !currentCategories.includes(category)) {
    const updated = [...currentCategories, category].sort((a, b) => a.localeCompare(b));
    await updateDoc(recommenderRef, {
      categories: updated.join(" • "),
    });
  }
}

      setSuccessMessage("Saved to your profile.");

      setUrl("");
      setTitle("");
      setNotes("");
      setPreview(null);
      setShowOptionalFields(false);

      setTimeout(() => {
  router.push(`/recommenders/${userId}`);
}, 700);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while saving. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-neutral-600">Checking your login…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Save something good
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
            Add a recommendation
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
            Paste a link and save it fast. Title and preview can fill themselves
            in. Notes are optional.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="url"
              className="mb-2 block text-sm font-medium text-neutral-800"
            >
              Link
            </label>

            <input
              id="url"
              type="text"
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              placeholder="Paste a product, article, video, or any page link"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-base outline-none transition focus:border-neutral-900"
            />

            <p className="mt-2 text-xs text-neutral-500">
              This is the only required field.
            </p>
          </div>

          {urlLooksValid && (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Preview
                  </p>

                  <h2 className="mt-1 line-clamp-2 text-base font-semibold text-neutral-900">
                    {derivedTitle || "Generating title…"}
                  </h2>

                  <p className="mt-1 break-all text-xs text-neutral-500">
                    {normalizedUrl}
                  </p>

                  {(preview?.description || hostname) && (
                    <p className="mt-2 line-clamp-3 text-sm text-neutral-600">
                      {preview?.description || hostname}
                    </p>
                  )}

                 <div className="mt-3">
  <p className="mb-2 text-xs font-medium text-neutral-500">
  Choose a category (auto-selected)
</p>

  <div className="flex flex-wrap gap-2">
    {CATEGORY_OPTIONS.map((option) => (
      <button
        key={option}
        type="button"
        onClick={() => setCategory(option)}
        className={
          option === category
            ? "inline-flex items-center rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white"
            : "inline-flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-700"
        }
      >
        {option}
      </button>
    ))}
  </div>
</div>
                </div>

                {preview?.image ? (
                  <img
                    src={preview.image}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                ) : null}
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                {isFetchingPreview ? (
                  <span>Fetching preview…</span>
                ) : (
                  <span>Looks ready to save.</span>
                )}
              </div>
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={() => setShowOptionalFields((prev) => !prev)}
              className="text-sm font-medium text-neutral-700 underline underline-offset-4"
            >
              {showOptionalFields ? "Hide optional fields" : "Add title or notes"}
            </button>
          </div>

          {showOptionalFields && (
            <div className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-medium text-neutral-800"
                >
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  placeholder="Optional, unless the app cannot generate one"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none transition focus:border-neutral-900"
                />
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="mb-2 block text-sm font-medium text-neutral-800"
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  placeholder="Why do you recommend this? Optional."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none transition focus:border-neutral-900"
                />
              </div>
            </div>
          )}

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSubmitting || !url.trim()}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : "Save to profile"}
            </button>

            <button
              type="button"
              onClick={() => router.push(`/recommenders/${userId}`)}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-neutral-300 px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}