"use client";

import { useState } from "react";

type Props = {
  url: string;
};

export default function CopyRecommendationLinkButton({ url }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Could not copy link:", error);
      alert("Could not copy link.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
    >
      {copied ? "Link Copied!" : "Copy Link"}
    </button>
  );
}