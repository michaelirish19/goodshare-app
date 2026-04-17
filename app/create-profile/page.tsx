"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { writeActivity } from "../lib/writeActivity";

function CreateProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const ref = searchParams.get("ref") || "";
  const pick = searchParams.get("pick") || "";

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedUserId, setSavedUserId] = useState<string | null>(null);
  const [savedName, setSavedName] = useState("");

  const addCategory = () => {
    const trimmed = categoryInput.trim();
    if (!trimmed) return;
    const alreadyExists = categories.some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (alreadyExists) { setCategoryInput(""); return; }
    setCategories([...categories, trimmed]);
    setCategoryInput("");
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addCategory(); }
  };

  const removeCategory = (cat: string) => setCategories(categories.filter((c) => c !== cat));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      try {
        const profileRef = doc(db, "recommenders", user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) { router.push("/"); return; }
        setCheckingProfile(false);
      } catch (error) {
        console.error("Error checking profile:", error);
        setCheckingProfile(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const user = auth.currentUser;
    if (!user) { setError("You must be logged in."); return; }

    const trimmedName = name.trim();
    const trimmedRole = role.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName || !trimmedRole) { setError("Please complete your name and role."); return; }

    const finalCategories = [...categories];
    const trimmedInput = categoryInput.trim();
    if (trimmedInput) {
      const alreadyExists = finalCategories.some((c) => c.toLowerCase() === trimmedInput.toLowerCase());
      if (!alreadyExists) finalCategories.push(trimmedInput);
    }
    if (finalCategories.length === 0) { setError("Please add at least one category."); return; }

    setIsSaving(true);

    try {
      await setDoc(doc(db, "recommenders", user.uid), {
        name: trimmedName, role: trimmedRole, description: trimmedDescription,
        categories: finalCategories.join(" • "),
        userId: user.uid, createdAt: serverTimestamp(),
        totalRatings: 0, totalRatingScore: 0,
        totalOutboundClickCount: 0, referralCount: 0,
        isBetaUser: true,
        ...(ref ? { referredBy: ref } : {}),
        ...(pick ? { referredByPick: pick } : {}),
        ...(ref ? { referredAt: serverTimestamp() } : {}),
      });

      if (ref) {
        try {
          const referrerRef = doc(db, "recommenders", ref);
          await updateDoc(referrerRef, { referralCount: increment(1) });
        } catch (referralError) {
          console.error("Referral tracking failed:", referralError);
        }
      }

      // Write activity event
      await writeActivity("new_sharer", user.uid, trimmedName);

      setSavedUserId(user.uid);
      setSavedName(trimmedName);
    } catch (error) {
      console.error("Error creating profile:", error);
      setError("Could not save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (checkingProfile) return <div className="text-sm text-gray-500">Loading...</div>;

  if (savedUserId) {
    const firstName = savedName.split(" ")[0];
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">🎉</div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to GoodShare, {firstName}!</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">Your profile is live. Here&apos;s how to make the most of it right now.</p>
        <div className="mt-8 space-y-3 text-left">
          <a href={`/add?recommenderId=${savedUserId}`} className="flex items-start gap-4 rounded-2xl border-2 border-black bg-black p-5 text-white transition hover:opacity-90">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-black text-lg font-bold">1</div>
            <div>
              <p className="font-semibold">Add your first pick</p>
              <p className="mt-0.5 text-xs leading-5 text-gray-300">Paste a link to something you genuinely recommend. Your first pick earns you your first badge.</p>
            </div>
          </a>
          <a href={`/recommenders/${savedUserId}`} className="flex items-start gap-4 rounded-2xl border border-gray-200 p-5 transition hover:border-gray-300 hover:shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 text-lg font-bold">2</div>
            <div>
              <p className="font-semibold text-gray-900">View your profile</p>
              <p className="mt-0.5 text-xs leading-5 text-gray-500">See how your profile looks to others. Grab your QR code and share it with someone today.</p>
            </div>
          </a>
          <a href="/discover" className="flex items-start gap-4 rounded-2xl border border-gray-200 p-5 transition hover:border-gray-300 hover:shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 text-lg font-bold">3</div>
            <div>
              <p className="font-semibold text-gray-900">Explore other sharers</p>
              <p className="mt-0.5 text-xs leading-5 text-gray-500">Browse picks from real people. Rate something you&apos;ve already bought and help build the community.</p>
            </div>
          </a>
        </div>
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
          <p className="text-sm font-semibold text-green-800">🌱 You&apos;re a Founding Sharer</p>
          <p className="mt-1 text-xs leading-5 text-green-700">You joined GoodShare during beta. This badge will always be on your profile — a mark of the people who were here first.</p>
        </div>
        <button onClick={() => router.push("/")} className="mt-6 text-sm text-gray-400 underline underline-offset-4 transition hover:text-gray-600">Go to home page</button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">Welcome to GoodShare</p>
        <h1 className="text-3xl font-bold tracking-tight">Create your profile</h1>
        <p className="mt-2 text-sm text-gray-600">Set up your public sharer profile with a short introduction and the categories you share in.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">Name</label>
          <input id="name" className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-gray-900"
            placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="role" className="mb-2 block text-sm font-medium text-gray-700">Role</label>
          <input id="role" className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-gray-900"
            placeholder="e.g. Woodworker, Home Cook, Personal Trainer" value={role} onChange={(e) => setRole(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">About you <span className="text-gray-400">(optional)</span></label>
          <textarea id="description" className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-gray-900"
            placeholder="Tell people who you are, what you focus on, and why they should trust your picks."
            value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </div>
        <div>
          <label htmlFor="categoryInput" className="mb-2 block text-sm font-medium text-gray-700">Categories</label>
          <input id="categoryInput" className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-gray-900"
            placeholder="Type a category and press Enter" value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)} onKeyDown={handleCategoryKeyDown} />
          {categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button key={category} type="button" onClick={() => removeCategory(category)}
                  className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700 transition hover:bg-gray-100">
                  {category} ×
                </button>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-gray-500">Press Enter after each category. These help people find your profile.</p>
        </div>
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <button type="submit" disabled={isSaving}
          className="w-full rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50">
          {isSaving ? "Saving…" : "Create my profile"}
        </button>
      </form>
    </div>
  );
}

export default function CreateProfilePage() {
  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-md">
        <Suspense fallback={<div className="text-sm text-gray-500">Loading...</div>}>
          <CreateProfileForm />
        </Suspense>
      </div>
    </main>
  );
}