import type { Metadata } from "next";
import { db } from "../../../../firebase";
import OwnerControls from "../../../../components/OwnerControls";
import QRCodeCard from "../../../../components/QRCodeCard";
import PickDetailActions from "../../../../components/PickDetailActions";
import PickReviews from "../../../../components/PickReviews";
import PickComments from "../../../../components/PickComments";
import { doc, getDoc } from "firebase/firestore";

const BASE_URL = "https://goodshare-app.vercel.app";
const DEFAULT_IMAGE = `${BASE_URL}/icons/icon-512.png`;

type Recommender = {
  name: string;
  role: string;
  categories: string;
  userId?: string;
  description?: string;
};

type Recommendation = {
  title: string;
  description: string;
  url: string;
  category: string;
  image?: string;
  siteName?: string;
};

type PageProps = {
  params: Promise<{
    id: string;
    recommendationId: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, recommendationId } = await params;

  try {
    const recommenderSnap = await getDoc(doc(db, "recommenders", id));
    const recommendationSnap = await getDoc(
      doc(db, "recommenders", id, "recommendations", recommendationId)
    );

    if (!recommenderSnap.exists() || !recommendationSnap.exists()) {
      return { title: "Pick not found — GoodShare" };
    }

    const recommender = recommenderSnap.data() as Recommender;
    const recommendation = recommendationSnap.data() as Recommendation;

    const title = `${recommendation.title} — recommended by ${recommender.name}`;
    const description = recommendation.description
      ? `${recommender.name} says: "${recommendation.description.slice(0, 150)}${recommendation.description.length > 150 ? "…" : ""}"`
      : `${recommender.name} recommends this on GoodShare.`;
    const image = recommendation.image || DEFAULT_IMAGE;
    const pageUrl = `${BASE_URL}/recommenders/${id}/recommendations/${recommendationId}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: pageUrl,
        siteName: "GoodShare",
        images: [{ url: image, width: 1200, height: 630, alt: recommendation.title }],
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return { title: "GoodShare — Recommendations from real people" };
  }
}

export default async function RecommendationPage({ params }: PageProps) {
  const { id, recommendationId } = await params;

  const recommenderRef = doc(db, "recommenders", id);
  const recommenderSnap = await getDoc(recommenderRef);

  if (!recommenderSnap.exists()) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-black">
        <div className="mx-auto max-w-3xl">
          <a href="/" className="mb-6 inline-block text-sm text-gray-500 hover:text-black">
            Back to GoodShare
          </a>
          <h1 className="text-2xl font-bold">Sharer not found</h1>
        </div>
      </main>
    );
  }

  const recommender = recommenderSnap.data() as Recommender;

  const recommendationRef = doc(db, "recommenders", id, "recommendations", recommendationId);
  const recommendationSnap = await getDoc(recommendationRef);

  if (!recommendationSnap.exists()) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-black">
        <div className="mx-auto max-w-3xl">
          <a href={`/recommenders/${id}`} className="mb-6 inline-block text-sm text-gray-500 hover:text-black">
            Back to profile
          </a>
          <h1 className="text-2xl font-bold">Pick not found</h1>
        </div>
      </main>
    );
  }

  const recommendation = recommendationSnap.data() as Recommendation;

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-black sm:px-6">
      <div className="mx-auto max-w-3xl">

        <a
          href={`/recommenders/${id}`}
          className="mb-8 inline-block text-sm text-gray-500 transition hover:text-black"
        >
          Back to {recommender.name}&apos;s picks
        </a>

        <section className="rounded-2xl border border-gray-200 p-6 shadow-sm">

          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Pick by{" "}
            <a href={`/recommenders/${id}`} className="underline hover:text-black">
              {recommender.name}
            </a>
          </p>

          <h1 className="mt-2 text-3xl font-bold leading-tight">{recommendation.title}</h1>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
              {recommendation.category || "Uncategorized"}
            </span>
          </div>

          {recommendation.description && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Why {recommender.name} recommends this
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                {recommendation.description}
              </p>
            </div>
          )}

          <PickDetailActions
            id={id}
            recommendationId={recommendationId}
            recommenderName={recommender.name}
            pickTitle={recommendation.title}
            pickNote={recommendation.description}
          />

          <PickReviews
            recommenderId={id}
            recommendationId={recommendationId}
          />

          <PickComments
            recommenderId={id}
            recommendationId={recommendationId}
          />

        </section>

        <QRCodeCard
          url={`${BASE_URL}/go/${id}/${recommendationId}`}
          title="Share this pick"
        />

        <OwnerControls
          type="recommendation"
          profileUserId={recommender.userId}
          recommenderId={id}
          recommendationId={recommendationId}
        />

      </div>
    </main>
  );
}