"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";

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

  const addCategory = () => {
    const trimmed = categoryInput.trim();
    if (!trimmed) return;
    const alreadyExists = categories.some(
      (category) => category.toLowerCase() === trimmed.toLowerCase()
    );
    if (alreadyExists) {
      setCategoryInput("");
      return;
    }
    setCategories([...categories, trimmed]);
    setCategoryInput("");
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCategory();
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    setCategories(categories.filter((category) => category !== categoryToRemove));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const profileRef = doc(db, "recommenders", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          router.push("/");
          return;
        }

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

    if (!user) {
      setError("You must be logged in.");
      return;
    }

    const trimmedName = name.trim();
    const trimmedRole = role.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName || !trimmedRole) {
      setError("Please complete your name and role.");
      return;
    }

    const finalCategories = [...categories];
    const trimmedInput = categoryInput.trim();

    if (trimmedInput) {
      const alreadyExists = finalCategories.some(
        (category) => category.toLowerCase() === trimmedInput.toLowerCase()
      );
      if (!alreadyExists) {
        finalCategories.push(trimmedInput);
      }
    }

    if (finalCategories.length === 0) {
      setError("Please add at least one category.");
      return;
    }

    setIsSaving(true);

    try {
      // Save the profile
      await setDoc(doc(db, "recommenders", user.uid), {
        name: trimmedName,
        role: trimmedRole,
        description: trimmedDescription,
        categories: finalCategories.join(" • "),
        userId: user.uid,
        createdAt: serverTimestamp(),
        totalRatings: 0,
        totalRatingScore: 0,
        totalOutboundClickCount: 0,
        referralCount: 0,
        ...(ref ? { referredBy: ref } : {}),
        ...(pick ? { referredByPick: pick } : {}),
        ...(ref ? { referredAt: serverTimestamp() } : {}),
      });

      // If referred by a sharer, increment their referral count
      if (ref) {
        try {
          const referrerRef = doc(db, "recommenders", ref);
          await updateDoc(referrerRef, {
            referralCount: increment(1),
          });
        } catch (referralError) {
          // Don't block profile creation if referral tracking fails
          console.error("Referral tracking failed:", referralError);
        }
      }

      router.push("/");
    } catch (error) {
      console.error("Error creating profile:", error);
      setError("Could not save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="text-sm text-gray-500">Loading...</div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Welcome to GoodShare
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Create your profile</h1>
        <p className="mt-2 text-sm text-gray-600">
          Set up your public sharer profile with a short introduction and the categories you share in.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-gray-900"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="role" className="mb-2 block text-sm font-medium text-gray-700">
            Role
          </label>
          <input
            id="role"
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-gray-900"
            placeholder="e.g. Woodworker, Home Cook, Personal Trainer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
            About you <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="description"
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-gray-900"
            placeholder="Tell people who you are, what you focus on, and why they should trust your picks."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <label htmlFor="categoryInput" className="mb-2 block text-sm font-medium text-gray-700">
            Categories
          </label>
          <input
            id="categoryInput"
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-gray-900"
            placeholder="Type a category and press Enter"
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
            onKeyDown={handleCategoryKeyDown}
          />

          {categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => removeCategory(category)}
                  className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700 transition hover:bg-gray-100"
                >
                  {category} ×
                </button>
              ))}
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500">
            Press Enter after each category. These help people find your profile.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        >
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