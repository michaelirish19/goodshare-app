"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { writeActivity, incrementPickCount } from "@/lib/writeActivity";
await incrementPickCount();

type PreviewData = {
  title: string;
  description: string;
  image: string;
  siteName: string;
};

const CATEGORY_OPTIONS = [
  "Product", "Tools", "Gear", "Clothes", "Accessories", "Other",
];

const NOTE_PROMPTS = [
  "How long have you been using this?",
  "Who would you recommend this to?",
  "What problem does this solve for you?",
  "What makes this better than alternatives?",
  "What would you tell a friend about this?",
];

function isValidUrl(value: string) {
  try { new URL(value); return true; } catch { return false; }
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
    const path = url.pathname.replace(/\/+/g, " ").replace(/[-_]/g, " ").trim();
    const hostname = url.hostname.replace(/^www\./, "");
    if (path && path !== "/") {
      const cleanedPath = path.split(" ").filter(Boolean).slice(0, 8).join(" ");
      return cleanedPath.charAt(0).toUpperCase() + cleanedPath.slice(1);
    }
    return hostname;
  } catch { return ""; }
}

function prettyHostname(rawUrl: string) {
  try { const url = new URL(rawUrl); return url.hostname.replace(/^www\./, ""); }
  catch { return ""; }
}

function inferCategory(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be") || host.includes("vimeo.com")) return "Video";
    if (host.includes("homedepot.com") || host.includes("lowes.com") || host.includes("harborfreight.com")) return "Tools";
    if (host.includes("rei.com") || host.includes("backcountry.com") || host.includes("cabelas.com")) return "Gear";
    if (host.includes("nike.com") || host.includes("adidas.com") || host.includes("uniqlo.com")) return "Clothes";
    if (host.includes("amazon.") || host.includes("etsy.com") || host.includes("ebay.com") || host.includes("walmart.com") || host.includes("target.com")) return "Product";
    if (host.includes("medium.com") || host.includes("substack.com")) return "Article";
    if (host.includes("spotify.com") || host.includes("podcasts.apple.com")) return "Podcast";
    return "Other";
  } catch { return "Other"; }
}

function getNoteEncouragement(length: number): { text: string; color: string } {
  if (length === 0) return { text: "", color: "" };
  if (length < 20) return { text: "Keep going…", color: "text-neutral-400" };
  if (length < 60) return { text: "Great start!", color: "text-amber-600" };
  if (length < 120) return { text: "Perfect length ✓", color: "text-green-600" };
  return { text: "Nice and detailed ✓", color: "text-green-600" };
}

export default function AddRecommendationPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [authLoading, setAuthLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedPickId, setSavedPickId] = useState<string>("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [showTitle, setShowTitle] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<unknown>(null);
  const [promptIndex] = useState(() => Math.floor(Math.random() * NOTE_PROMPTS.length));

  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      setSpeechSupported(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUserId(user?.uid ?? null);
      setAuthLoading(false);
      if (user) {
        try {
          const profileRef = doc(db, "recommenders", user.uid);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            setUserName(profileSnap.data().name || "");
          }
        } catch { /* ignore */ }
      }
    });
    return () => unsubscribe();
  }, []);

  const normalizedUrl = useMemo(() => normalizeUrl(url), [url]);
  const urlLooksValid = useMemo(() => !!normalizedUrl && isValidUrl(normalizedUrl), [normalizedUrl]);

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

  const finalCategory = customCategory.trim() || category;

  function startListening() {
    type SpeechRecognitionConstructor = new () => {
      continuous: boolean; interimResults: boolean; lang: string;
      onresult: ((event: unknown) => void) | null;
      onend: (() => void) | null; onerror: (() => void) | null;
      start: () => void; stop: () => void;
    };
    const SpeechRecognitionAPI = (
      (window as unknown as Record<string, unknown>)["SpeechRecognition"] ||
      (window as unknown as Record<string, unknown>)["webkitSpeechRecognition"]
    ) as SpeechRecognitionConstructor | undefined;
    if (!SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: unknown) => {
      const e = event as { results: Array<Array<{ transcript: string }>> };
      const transcript = e.results[0][0].transcript;
      setNotes((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  function stopListening() {
    const recognition = recognitionRef.current as { stop: () => void } | null;
    recognition?.stop();
    setIsListening(false);
  }

  useEffect(() => {
    setError("");
    if (!urlLooksValid) { setPreview(null); setCategory(""); return; }
    setCategory(inferCategory(normalizedUrl));

    async function fetchPreview(targetUrl: string) {
      if (!isValidUrl(targetUrl)) return;
      setIsFetchingPreview(true);
      try {
        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(targetUrl)}`, { method: "GET", cache: "no-store" });
        if (!response.ok) throw new Error("Preview unavailable");
        const data = await response.json();
        const nextPreview: PreviewData = {
          title: data?.title ?? "", description: data?.description ?? "",
          image: data?.image ?? "", siteName: data?.siteName ?? "",
        };
        setPreview(nextPreview);
        if (!title.trim() && nextPreview.title?.trim()) setTitle(nextPreview.title.trim());
      } catch {
        setPreview({ title: fallbackTitleFromUrl(targetUrl), description: "", image: "", siteName: prettyHostname(targetUrl) });
        if (!title.trim()) setTitle(fallbackTitleFromUrl(targetUrl));
      } finally { setIsFetchingPreview(false); }
    }

    const timer = setTimeout(() => { fetchPreview(normalizedUrl); }, 500);
    return () => clearTimeout(timer);
  }, [normalizedUrl, urlLooksValid]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (authLoading) { setError("Still checking your login. Try again in a moment."); return; }
    if (!userId) { setError("You need to be logged in to save a pick."); return; }
    if (!normalizedUrl || !isValidUrl(normalizedUrl)) { setError("Paste a valid link to save something."); return; }
    const finalTitle = derivedTitle.trim();
    if (!finalTitle) { setError("We could not generate a title. Add one manually and try again."); return; }

    setIsSubmitting(true);

    try {
      const docRef = await addDoc(collection(db, "recommenders", userId, "recommendations"), {
        recommenderId: userId,
        userId,
        url: normalizedUrl,
        title: finalTitle,
        description: notes.trim(),
        category: finalCategory,
        siteName: preview?.siteName || hostname || "",
        image: preview?.image || "",
        createdAt: serverTimestamp(),
        outboundClicks: 0,
        outboundClickCount: 0,
      });

      // Sync categories
      const recommenderRef = doc(db, "recommenders", userId);
      const recommenderSnap = await getDoc(recommenderRef);
      if (recommenderSnap.exists()) {
        const existing = recommenderSnap.data();
        const currentCategories = existing.categories
          ? existing.categories.split("•").map((c: string) => c.trim()).filter(Boolean)
          : [];
        if (finalCategory && !currentCategories.includes(finalCategory)) {
          const updated = [...currentCategories, finalCategory].sort((a, b) => a.localeCompare(b));
          await updateDoc(recommenderRef, { categories: updated.join(" • ") });
        }
      }

     // Write activity event
await writeActivity("new_pick", userId, userName || "Someone", {
  pickTitle: finalTitle,
  pickId: docRef.id,
});

// Increment global pick count
await incrementPickCount();

setSavedPickId(docRef.id);
setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while saving. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const noteEncouragement = getNoteEncouragement(notes.trim().length);

  if (authLoading) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-neutral-600">Checking your login…</p>
        </div>
      </main>
    );
  }

  if (saved) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">🎉</div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950">Pick saved!</h2>
          <p className="mt-2 text-sm text-neutral-600"><strong>{derivedTitle}</strong> has been added to your profile.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => { setSaved(false); setUrl(""); setTitle(""); setNotes(""); setCategory(""); setCustomCategory(""); setPreview(null); setShowTitle(false); }}
              className="inline-flex items-center justify-center rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-80"
            >Add another pick</button>
            <button
              onClick={() => router.push(`/recommenders/${userId}`)}
              className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >View my profile</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Save something good</p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">Add a Pick</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">Paste a link. Then tell people why it&apos;s worth it — that&apos;s what makes your pick worth sharing.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="url" className="mb-1 block text-xs font-semibold uppercase tracking-widest text-neutral-400">Step 1</label>
            <label htmlFor="url" className="mb-2 block text-sm font-medium text-neutral-800">Paste your link</label>
            <input id="url" type="text" inputMode="url" autoCapitalize="off" autoCorrect="off" autoComplete="off"
              placeholder="Paste a product, article, video, or any page link"
              value={url} onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-base outline-none transition focus:border-neutral-900"
            />
          </div>

          {urlLooksValid && (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Preview</p>
                  <h2 className="mt-1 line-clamp-2 text-base font-semibold text-neutral-900">
                    {isFetchingPreview ? "Fetching title…" : derivedTitle || "Could not generate title — add one below"}
                  </h2>
                  <p className="mt-1 break-all text-xs text-neutral-500">{normalizedUrl}</p>
                  {preview?.description && <p className="mt-2 line-clamp-3 text-sm text-neutral-600">{preview.description}</p>}
                </div>
                {preview?.image && <img src={preview.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />}
              </div>
              <div className="mt-3 text-xs text-neutral-500">{isFetchingPreview ? "Fetching preview…" : "Looks ready to save."}</div>
            </div>
          )}

          {urlLooksValid && (
            <div className="rounded-2xl border-2 border-neutral-900 p-5">
              <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">Step 2</div>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <label htmlFor="notes" className="block text-base font-bold text-neutral-900">Why do you recommend this?</label>
                  <p className="mt-1 text-xs text-neutral-500">This is your voice — the most important part of your pick. Speak or type it.</p>
                </div>
                {speechSupported && (
                  <button type="button" onClick={isListening ? stopListening : startListening}
                    className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${isListening ? "bg-red-100 text-red-700 animate-pulse" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}`}>
                    <span>{isListening ? "🔴" : "🎤"}</span>
                    {isListening ? "Listening…" : "Speak it"}
                  </button>
                )}
              </div>
              <textarea id="notes" rows={4} placeholder={NOTE_PROMPTS[promptIndex]} value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`w-full rounded-2xl border px-4 py-3 text-base outline-none transition focus:border-neutral-900 ${isListening ? "border-red-300 bg-red-50" : "border-neutral-300 bg-neutral-50"}`}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-xs font-medium ${noteEncouragement.color}`}>{noteEncouragement.text}</span>
                <span className="text-xs text-neutral-400">{notes.trim().length} chars</span>
              </div>
            </div>
          )}

          {urlLooksValid && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">Step 3</div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">Category</label>
              <p className="mb-3 text-xs text-neutral-500">Auto-selected based on the link — tap to change, or type your own below.</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((option) => (
                  <button key={option} type="button" onClick={() => { setCategory(option); setCustomCategory(""); }}
                    className={option === category && !customCategory.trim()
                      ? "inline-flex items-center rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white"
                      : "inline-flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"}>
                    {option}
                  </button>
                ))}
              </div>
              <input type="text" placeholder="Or type a custom category…" value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="mt-3 w-full rounded-2xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-neutral-900"
              />
              {customCategory.trim() && (
                <p className="mt-1.5 text-xs text-neutral-500">Will be saved as: <strong>{customCategory.trim()}</strong></p>
              )}
            </div>
          )}

          {urlLooksValid && (
            <div>
              <button type="button" onClick={() => setShowTitle((prev) => !prev)}
                className="text-xs font-medium text-neutral-500 underline underline-offset-4">
                {showTitle ? "Hide title field" : "Edit title (optional)"}
              </button>
              {showTitle && (
                <div className="mt-3">
                  <input id="title" type="text" placeholder="Auto-generated — only change if needed" value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none transition focus:border-neutral-900"
                  />
                </div>
              )}
            </div>
          )}

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={isSubmitting || !url.trim()}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
              {isSubmitting ? "Saving…" : "Save to profile"}
            </button>
            <button type="button" onClick={() => router.push(`/recommenders/${userId}`)}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-neutral-300 px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}