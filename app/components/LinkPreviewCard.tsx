"use client";

import { useEffect, useState } from "react";

type LinkPreview = {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
};

type Props = {
  url: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  fallbackImage?: string;
  fallbackSiteName?: string;
};

export default function LinkPreviewCard({
  url,
  fallbackTitle = "",
  fallbackDescription = "",
  fallbackImage = "",
  fallbackSiteName = "",
}: Props) {
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadPreview() {
      try {
        setLoading(true);

        const requestUrl = `/api/link-preview?url=${encodeURIComponent(url)}`;
        console.log("Preview request:", requestUrl);
        console.log("Original recommendation URL:", url);

        const response = await fetch(requestUrl);

        if (!response.ok) {
          if (isMounted) {
            setPreview({
              url,
              title: fallbackTitle,
              description: fallbackDescription,
              image: fallbackImage,
              siteName: fallbackSiteName,
            });
          }
          return;
        }

        const data = await response.json();

        if (isMounted) {
          setPreview({
            url: data.url || url,
            title: data.title || fallbackTitle,
            description: data.description || fallbackDescription,
            image: data.image || fallbackImage,
            siteName: data.siteName || fallbackSiteName,
          });
        }
      } catch {
        if (isMounted) {
          setPreview({
            url,
            title: fallbackTitle,
            description: fallbackDescription,
            image: fallbackImage,
            siteName: fallbackSiteName,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPreview();

    return () => {
      isMounted = false;
    };
  }, [url, fallbackTitle, fallbackDescription, fallbackImage, fallbackSiteName]);

  if (loading) {
    return (
      <div className="mt-3 rounded-xl border border-neutral-200 p-3 text-sm text-neutral-500">
        Loading link preview...
      </div>
    );
  }

  if (
    !preview ||
    (!preview.title &&
      !preview.description &&
      !preview.image &&
      !preview.siteName)
  ) {
    return (
      <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">
        <div className="break-all font-medium">{url}</div>
      </div>
    );
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noreferrer"
      className="mt-3 block overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:shadow-md"
    >
      {preview.image ? (
        <img
          src={preview.image}
          alt={preview.title || "Link preview image"}
          className="h-44 w-full object-cover"
        />
      ) : null}

      <div className="p-3">
        <div className="text-xs uppercase tracking-wide text-neutral-500">
          {preview.siteName || "Website"}
        </div>

        <div className="mt-1 line-clamp-2 text-sm font-semibold text-neutral-900">
          {preview.title || preview.url}
        </div>

        {preview.description ? (
          <div className="mt-1 line-clamp-3 text-sm text-neutral-600">
            {preview.description}
          </div>
        ) : null}
      </div>
    </a>
  );
}