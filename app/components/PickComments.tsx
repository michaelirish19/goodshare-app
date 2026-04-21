"use client";

import { useEffect, useRef, useState } from "react";
import {
  addDoc, collection, deleteDoc, doc,
  getDoc, onSnapshot, orderBy, query, serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";

type Comment = {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: { seconds: number };
};

type Props = {
  recommenderId: string;
  recommendationId: string;
};

function timeAgo(seconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / (86400 * 30))}mo ago`;
}

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function PickComments({ recommenderId, recommendationId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ uid: string; name: string } | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profileSnap = await getDoc(doc(db, "recommenders", user.uid));
          const name = profileSnap.exists()
            ? profileSnap.data().name
            : user.displayName || user.email || "Anonymous";
          setCurrentUser({ uid: user.uid, name });
        } catch {
          setCurrentUser({ uid: user.uid, name: user.displayName || "Anonymous" });
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const commentsRef = collection(
      db, "recommenders", recommenderId, "recommendations", recommendationId, "comments"
    );
    const q = query(commentsRef, orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Comment)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [recommenderId, recommendationId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!currentUser) { setError("You need to be logged in to comment."); return; }

    setSubmitting(true);
    try {
      const commentsRef = collection(
        db, "recommenders", recommenderId, "recommendations", recommendationId, "comments"
      );
      await addDoc(commentsRef, {
        authorId: currentUser.uid,
        authorName: currentUser.name,
        text: trimmed,
        createdAt: serverTimestamp(),
      });
      setText("");
      textareaRef.current?.focus();
    } catch (err) {
      console.error("Comment failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await deleteDoc(
        doc(db, "recommenders", recommenderId, "recommendations", recommendationId, "comments", commentId)
      );
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  const canDelete = (comment: Comment) =>
    currentUser && (currentUser.uid === comment.authorId || currentUser.uid === recommenderId);

  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Discussion</p>
        <h2 className="text-lg font-bold text-gray-900">
          {loading ? "Comments" : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
        </h2>
      </div>

      {!loading && comments.length > 0 && (
        <div className="mb-6 space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3 rounded-2xl border border-gray-100 p-4">
              <a href={`/recommenders/${comment.authorId}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200 transition">
                  {getInitials(comment.authorName)}
                </div>
              </a>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={`/recommenders/${comment.authorId}`}
                      className="text-xs font-semibold text-gray-900 hover:underline"
                    >
                      {comment.authorName}
                    </a>
                    <span className="text-xs text-gray-400">
                      {comment.createdAt?.seconds ? timeAgo(comment.createdAt.seconds) : "just now"}
                    </span>
                  </div>
                  {canDelete(comment) && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-xs text-gray-300 hover:text-red-500 transition"
                      title="Delete comment"
                    >
                      ×
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm leading-6 text-gray-700">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && comments.length === 0 && (
        <div className="mb-6 rounded-2xl border border-dashed border-gray-200 px-6 py-6 text-center">
          <p className="text-sm text-gray-400">No comments yet. Ask a question or share your thoughts.</p>
        </div>
      )}

      {currentUser ? (
        <form onSubmit={handleSubmit} className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xs font-bold text-gray-600">
            {getInitials(currentUser.name)}
          </div>
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              rows={2}
              placeholder="Ask a question or leave a comment…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-900 resize-none"
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !text.trim()}
                className="rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white transition hover:opacity-80 disabled:opacity-40"
              >
                {submitting ? "Posting…" : "Post comment"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-center">
          <p className="text-sm text-gray-500">
            <a href="/login" className="font-semibold text-black underline underline-offset-4 hover:opacity-70">Sign in</a>
            {" "}to join the discussion.
          </p>
        </div>
      )}
    </div>
  );
}