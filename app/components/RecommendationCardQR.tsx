"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

type Props = {
  url: string;
};

export default function RecommendationCardQR({ url }: Props) {
  const [showQR, setShowQR] = useState(false);

  const handleDownload = () => {
    const canvas = document.getElementById(`recommendation-qr-${encodeURIComponent(url)}`) as HTMLCanvasElement | null;
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = "goodshare-recommendation-qr.png";
    link.click();
  };

  const qrId = `recommendation-qr-${encodeURIComponent(url)}`;

  return (
    <div className="w-full">
      {!showQR ? (
        <button
          type="button"
          onClick={() => setShowQR(true)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          Generate QR Code
        </button>
      ) : (
        <div className="mt-3 rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col items-center gap-3">
            <QRCodeCanvas id={qrId} value={url} size={160} />

            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Download QR Code
              </button>

              <button
                type="button"
                onClick={() => setShowQR(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Hide QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}