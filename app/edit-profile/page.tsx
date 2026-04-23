"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function EditProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }

      setUserId(user.uid);

      try {
        const profileRef = doc(db, "recommenders", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) { router.push("/create-profile"); return; }

        const data = profileSnap.data();
        setName(data.name || "");
        setRole(data.role || "");
        setDescription(data.description || "");

        // Parse categories from "cat1 • cat2 • cat3" format
        const parsed = data.categories
          ? data.categories.split("•").map((c: string) => c.trim()).filter(Boolean)
          : [];
        setCategories(parsed);
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("Could not load your profile. Please try again.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  function addCategory() {
    const trimmed = categoryInput.trim();
    if (!trimmed) return;
    const alreadyExists = categories.some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (alreadyExists) { setCategoryInput(""); return; }
    setCategories([...categories, trimmed]);
    setCategoryInput("");
  }

  function handleCategoryKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); addCategory(); }
  }

  function removeCategory(cat: string) {
    setCategories(categories.filter((c) => c !== cat));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedRole = role.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName || !trimmedRole) {
      setError("Name and role are required.");
      return;
    }

    const finalCategories = [...categories];
    const trimmedInput = categoryInput.trim();
    if (trimmedInput) {
      const alreadyExists = finalCategories.some((c) => c.toLowerCase() === trimmedInput.toLowerCase());
      if (!alreadyExists) finalCategories.push(trimmedInput);
    }

    if (finalCategories.length === 0) {
      setError("Please add at least one category.");
      return;
    }

    setIsSaving(true);

    try {
      const profileRef = doc(db, "recommenders", userId!);
      await updateDoc(profileRef, {
        name: trimmedName,
        role: trimmedRole,
        description: trimmedDescription,
        categories: finalCategories.join(" • "),
      });

      setSaved(true);

      // Redirect back to profile after short delay
      setTimeout(() => {
        router.push(`/recommenders/${userId}`);
      }, 1500);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Could not save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-black">
        <div className="mx-auto max-w-md">
          <div className="text-sm text-gray-500">Loading your profile…</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-md">

        <a
          href={`/recommenders/${userId}`}
          className="mb-8 inline-block text-sm text-gray-500 transition hover:text-black"
        >
          ← Back to my profile
        </a>

        <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-6">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Your profile
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Edit profile</h1>
            <p className="mt-2 text-sm text-gray-600">
              Update your public profile. Changes are visible to everyone immediately.
            </p>
          </div>

          {saved ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
                ✓
              </div>
              <p className="font-semibold text-gray-900">Profile updated!</p>
              <p className="text-sm text-gray-500">Taking you back to your profile…</p>
            </div>
          ) : (
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
                  Press Enter after each category. Tap a category to remove it.
                </p>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? "Saving…" : "Save changes"}
                </button>
                <a
                  href={`/recommenders/${userId}`}
                  className="flex-1 rounded-2xl border border-gray-300 px-5 py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}