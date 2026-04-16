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
};

type QRItem = {
  id: string;
  label: string;
  url: string;
  category: string;
  isProfile?: boolean;
};

export default function ShareHub() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<QRItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedIds, setGeneratedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsubscribe();
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

        const recsRef = collection(db, "recommenders", userId!, "recommendations");
        const recsSnap = await getDocs(recsRef);

        const recs: Recommendation[] = recsSnap.docs.map((d) => ({
          id: d.id,
          title: d.data().title || "Untitled",
          category: d.data().category?.trim() || "Uncategorized",
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

  // Don't render if not logged in
  if (!userId) return null;

  // Group items by category
  const grouped: Record<string, QRItem[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  // Profile first, then categories alphabetically
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

          {/* Handle */}
          <div className="sticky top-0 bg-white px-5 pt-4 pb-3 border-b border-gray-100">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Share
                </p>
                <h2 className="text-lg font-bold text-gray-900">Your QR Codes</h2>
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
                      {/* Category header */}
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
                            <div className="flex items-center justify-between gap-3">
                              <p className={`text-sm font-semibold leading-snug ${
                                item.isProfile ? "text-gray-900" : "text-gray-800"
                              }`}>
                                {item.label}
                              </p>
                              <button
                                type="button"
                                onClick={() => toggleGenerated(item.id)}
                                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                  generatedIds.has(item.id)
                                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    : "bg-black text-white hover:opacity-80"
                                }`}
                              >
                                {generatedIds.has(item.id) ? "Hide QR" : "Show QR"}
                              </button>
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