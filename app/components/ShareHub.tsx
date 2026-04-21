"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { QRCodeCanvas } from "qrcode.react";

type Recommendation = {
  id: string;
  title: string;
  category: string;
  description?: string;
};

type QRItem = {
  id: string;
  label: string;
  url: string;
  category: string;
  description?: string;
  isProfile?: boolean;
};

type CopiedState = Record<string, boolean>;

export default function ShareHub() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<QRItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedIds, setGeneratedIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<CopiedState>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  // Listen for custom event from onboarding checklist
  useEffect(() => {
    function handleOpenHub() {
      setIsOpen(true);
    }
    window.addEventListener("goodshare:open-hub", handleOpenHub);
    return () => window.removeEventListener("goodshare:open-hub", handleOpenHub);
  }, []);

  // Open from PWA shortcut
  useEffect(() => {
  if (typeof window === "undefined") return;

  function checkShareParam() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("share") === "true") {
      setIsOpen(true);
      // Clean up the URL so it doesn't reopen on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete("share");
      window.history.replaceState({}, "", url.toString());
    }
  }

  // Check immediately and also after a short delay for slower devices
  checkShareParam();
  const timer = setTimeout(checkShareParam, 500);
  return () => clearTimeout(timer);
}, []);

  useEffect(() => {
    if (!userId || !isOpen || items.length > 0) return;

    async function loadItems() {
      setLoading(true);
      try {
        const profileRef = doc(db, "recommenders", userId!);
        const profileSnap = await getDoc(profileRef);
        const profileName = profileSnap.exists()
          ? profileSnap.data().name
          : "My Profile";

        setUserName(profileName);

        const recsRef = collection(db, "recommenders", userId!, "recommendations");
        const recsSnap = await getDocs(recsRef);

        const recs: Recommendation[] = recsSnap.docs.map((d) => ({
          id: d.id,
          title: d.data().title || "Untitled",
          category: d.data().category?.trim() || "Uncategorized",
          description: d.data().description || "",
        }));

        const sorted = recs.sort((a, b) => {
          if (a.category !== b.category) return a.category.localeCompare(b.category);
          return a.title.localeCompare(b.title);
        });

        const allItems: QRItem[] = [
          {
            id: "profile",
            label: profileName,
            url: `https://goodshare-app.vercel.app/recommenders/${userId}`,
            category: "My Profile",
            isProfile: true,
          },
          ...sorted.map((r) => ({
            id: r.id,
            label: r.title,
            url: `https://goodshare-app.vercel.app/go/${userId}/${r.id}`,
            category: r.category,
            description: r.description,
          })),
        ];

        setItems(allItems);
      } catch (err) {
        console.error("Failed to load share hub items:", err);
      } finally {
        setLoading(false);
      }
    }

    loadItems();
  }, [userId, isOpen]);

  function toggleGenerated(id: string) {
    setGeneratedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleShare(item: QRItem) {
    const shareText = item.isProfile
      ? `Check out ${userName}'s picks on GoodShare`
      : item.description
        ? `${userName} says: "${item.description.slice(0, 100)}${item.description.length > 100 ? "…" : ""}"`
        : `Check out this pick on GoodShare: ${item.label}`;

    const shareData = {
      title: item.isProfile ? `${userName}'s picks on GoodShare` : item.label,
      text: shareText,
      url: item.url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }

    // Desktop fallback — copy to clipboard
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied((prev) => ({ ...prev, [item.id]: true }));
      setTimeout(() => {
        setCopied((prev) => ({ ...prev, [item.id]: false }));
      }, 2000);
    } catch {
      prompt("Copy this link:", item.url);
    }
  }

  if (!userId) return null;

  const grouped: Record<string, QRItem[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  const categoryOrder = [
    "My Profile",
    ...Object.keys(grouped)
      .filter((c) => c !== "My Profile")
      .sort((a, b) => a.localeCompare(b)),
  ];

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg transition hover:opacity-80 active:scale-95"
        aria-label="Share hub"
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4l12 12M16 4L4 16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="18" cy="5" r="3" stroke="white" strokeWidth="2"/>
            <circle cx="6" cy="12" r="3" stroke="white" strokeWidth="2"/>
            <circle cx="18" cy="19" r="3" stroke="white" strokeWidth="2"/>
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </button>

      {/* ── Backdrop ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Drawer ── */}
      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 max-h-[82vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl">

          <div className="sticky top-0 bg-white px-5 pt-4 pb-3 border-b border-gray-100">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Share</p>
                <h2 className="text-lg font-bold text-gray-900">Your Picks</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>

          <div className="px-5 pb-10 pt-4">
            {loading ? (
              <p className="py-8 text-center text-sm text-gray-400">Loading your picks…</p>
            ) : items.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">No picks yet.</p>
                <a
                  href={`/add?recommenderId=${userId}`}
                  className="mt-3 inline-block rounded-xl bg-black px-5 py-2.5 text-xs font-semibold text-white hover:opacity-80"
                  onClick={() => setIsOpen(false)}
                >
                  Add your first pick →
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                {categoryOrder.map((category) => {
                  const categoryItems = grouped[category];
                  if (!categoryItems) return null;

                  return (
                    <div key={category}>
                      <div className="mb-3 flex items-center gap-3">
                        <h3 className={`text-xs font-semibold uppercase tracking-widest ${
                          category === "My Profile" ? "text-gray-900" : "text-gray-400"
                        }`}>
                          {category}
                        </h3>
                        <div className="h-px flex-1 bg-gray-100" />
                      </div>

                      <div className="space-y-2">
                        {categoryItems.map((item) => (
                          <div
                            key={item.id}
                            className={`rounded-2xl border p-4 transition ${
                              item.isProfile
                                ? "border-gray-900 bg-gray-50"
                                : "border-gray-200 bg-white"
                            }`}
                          >
                            {/* Title + action buttons */}
                            <div className="flex items-center justify-between gap-3">
                              <p className={`text-sm font-semibold leading-snug ${
                                item.isProfile ? "text-gray-900" : "text-gray-800"
                              }`}>
                                {item.label}
                              </p>
                              <div className="flex shrink-0 items-center gap-2">
                                {/* Share button */}
                                <button
                                  type="button"
                                  onClick={() => handleShare(item)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-black px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-80"
                                >
                                  {copied[item.id] ? (
                                    <>
                                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                        <circle cx="18" cy="5" r="3" stroke="white" strokeWidth="2"/>
                                        <circle cx="6" cy="12" r="3" stroke="white" strokeWidth="2"/>
                                        <circle cx="18" cy="19" r="3" stroke="white" strokeWidth="2"/>
                                        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                      </svg>
                                      Share
                                    </>
                                  )}
                                </button>

                                {/* QR button */}
                                <button
                                  type="button"
                                  onClick={() => toggleGenerated(item.id)}
                                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                    generatedIds.has(item.id)
                                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                                  }`}
                                >
                                  {generatedIds.has(item.id) ? "Hide QR" : "QR"}
                                </button>
                              </div>
                            </div>

                            {/* QR code — inline reveal */}
                            {generatedIds.has(item.id) && (
                              <div className="mt-4 flex justify-center">
                                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                  <QRCodeCanvas
                                    id={`sharehub-qr-${item.id}`}
                                    value={item.url}
                                    size={200}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}