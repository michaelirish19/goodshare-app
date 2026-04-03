"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function CreateProfilePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleCategoryKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCategory();
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    setCategories(
      categories.filter((category) => category !== categoryToRemove)
    );
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

    const user = auth.currentUser;

    if (!user) {
      alert("You must be logged in.");
      return;
    }

    const trimmedName = name.trim();
    const trimmedRole = role.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName || !trimmedRole) {
      alert("Please complete your name and role.");
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
      alert("Please add at least one category.");
      return;
    }

    setIsSaving(true);

    try {
      await setDoc(doc(db, "recommenders", user.uid), {
        name: trimmedName,
        role: trimmedRole,
        description: trimmedDescription,
        categories: finalCategories.join(" • "),
        userId: user.uid,
      });

      router.push("/");
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("Could not save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (checkingProfile) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-black">
        <div className="mx-auto max-w-md">
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-3xl font-bold">Create Your Profile</h1>
          <p className="mt-2 text-sm text-gray-600">
            Set up your public recommender profile with a short introduction and
            the categories you recommend in.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <input
                id="name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                placeholder="Michael Corcoran"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Role
              </label>
              <input
                id="role"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                placeholder="Licensed Massage Therapist"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Personal Description
              </label>
              <textarea
                id="description"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
                placeholder="Tell people who you are, what you focus on, and why they should trust your recommendations."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <p className="mt-2 text-sm text-gray-500">
                This shows up on your profile under an About section.
              </p>
            </div>

            <div>
              <label
                htmlFor="categoryInput"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Categories
              </label>
              <input
                id="categoryInput"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
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

              <p className="mt-2 text-sm text-gray-500">
                Press Enter after each category.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}