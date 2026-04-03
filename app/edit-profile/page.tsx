"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

export default function EditProfilePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const docRef = doc(db, "recommenders", user.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          router.push("/create-profile");
          return;
        }

        const data = docSnap.data();

        setName(data.name || "");
        setRole(data.role || "");
        setDescription(data.description || "");

        if (data.categories) {
          const split = data.categories.split(" • ");
          setCategories(split);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const addCategory = () => {
    const trimmed = categoryInput.trim();
    if (!trimmed) return;

    const exists = categories.some(
      (c) => c.toLowerCase() === trimmed.toLowerCase()
    );

    if (!exists) {
      setCategories([...categories, trimmed]);
    }

    setCategoryInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCategory();
    }
  };

  const removeCategory = (cat: string) => {
    setCategories(categories.filter((c) => c !== cat));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return;

    const finalCategories = [...categories];

    if (categoryInput.trim()) {
      const trimmed = categoryInput.trim();
      if (!finalCategories.includes(trimmed)) {
        finalCategories.push(trimmed);
      }
    }

    setIsSaving(true);

    try {
      await setDoc(doc(db, "recommenders", user.uid), {
        name: name.trim(),
        role: role.trim(),
        description: description.trim(), // ✅ ADDED
        categories: finalCategories.join(" • "),
        userId: user.uid,
      });

      router.push("/");
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const confirmDelete = confirm(
      "Are you sure you want to delete your profile?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "recommenders", user.uid));
      router.push("/");
    } catch (error) {
      console.error("Error deleting profile:", error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-10">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-3xl font-bold">Edit Profile</h1>

          <form onSubmit={handleSave} className="mt-6 space-y-5">
            {/* NAME */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* ROLE */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Role
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>

            {/* DESCRIPTION ✅ */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Personal Description
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell people who you are, what you focus on, and why they should trust your recommendations."
              />
            </div>

            {/* CATEGORIES */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Categories
              </label>

              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                placeholder="Add category and press Enter"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              {categories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => removeCategory(cat)}
                      className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {cat} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SAVE BUTTON */}
            <button
              disabled={isSaving}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>

          {/* DELETE */}
          <button
            onClick={handleDelete}
            className="mt-6 text-sm text-red-600 underline"
          >
            Delete Profile
          </button>
        </div>
      </div>
    </main>
  );
}