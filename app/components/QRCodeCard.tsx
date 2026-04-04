"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

type Props = {
  url: string;
};

export default function QRCodeCard({ url }: Props) {
  const [showQR, setShowQR] = useState(false);

  const handleDownload = () => {
    const canvas = document.getElementById("qr-code") as HTMLCanvasElement;
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = "goodshare-qr.png";
    link.click();
  };

  return (
    <div className="mt-6 rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700">
        Share this profile
      </h3>

      {!showQR ? (
        <button
          onClick={() => setShowQR(true)}
          className="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
        >
          Generate QR Code
        </button>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-3">
          <QRCodeCanvas id="qr-code" value={url} size={180} />

          <button
            onClick={handleDownload}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Download QR Code
          </button>

          <button
            onClick={() => setShowQR(false)}
            className="text-xs text-gray-500 underline"
          >
            Hide
          </button>
        </div>
      )}
    </div>
  );
}