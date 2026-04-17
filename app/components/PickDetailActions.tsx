"use client";

import ShareButton from "./ShareButton";

type Props = {
  id: string;
  recommendationId: string;
  recommenderName: string;
  pickTitle: string;
  pickNote?: string;
};

export default function PickDetailActions({
  id,
  recommendationId,
  recommenderName,
  pickTitle,
  pickNote,
}: Props) {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <a
        href={`/go/${id}/${recommendationId}`}
        className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-80"
      >
        View product →
      </a>
      <a
        href={`/rate/${id}/${recommendationId}`}
        className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        Rate this pick
      </a>
      <ShareButton
        title={pickTitle}
        url={`https://goodshare-app.vercel.app/go/${id}/${recommendationId}`}
        note={pickNote}
        recommenderName={recommenderName}
      />
    </div>
  );
}