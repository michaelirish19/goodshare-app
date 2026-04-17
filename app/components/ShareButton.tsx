"use client";

import { useState } from "react";

type Props = {
  title: string;
  url: string;
  note?: string;
  recommenderName?: string;
};

export default function ShareButton({
  title,
  url,
  note,
  recommenderName,
}: Props) {
  const [copied, setCopied] = useState(false);

  const shareText = recommenderName
    ? note
      ? `${recommenderName} says: "${note.slice(0, 100)}${note.length > 100 ? "…" : ""}"`
      : `Recommended by ${recommenderName} on GoodShare`
    : "Check this out on GoodShare";

  async function handleShare() {
    const shareData = {
      title: title,
      text: shareText,
      url: url,
    };

    // Try native Web Share API first
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or share failed — fall through to clipboard
        if ((err as Error).name === "AbortError") return;
      }
    }

    // Desktop fallback — copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last resort — show the URL
      prompt("Copy this link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
            <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
            <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Share
        </>
      )}
    </button>
  );
}