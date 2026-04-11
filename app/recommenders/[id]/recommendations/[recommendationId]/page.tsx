import { db } from "../../../../firebase";
import OwnerControls from "../../../../components/OwnerControls";
import QRCodeCard from "../../../../components/QRCodeCard";
import LinkPreviewCard from "../../../../components/LinkPreviewCard";
import { doc, getDoc } from "firebase/firestore";

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

  const recommendationRef = doc(
    db,
    "recommenders",
    id,
    "recommendations",
    recommendationId
  );
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

          <LinkPreviewCard
            url={recommendation.url}
            fallbackTitle={recommendation.title}
            fallbackDescription={recommendation.description}
            fallbackImage={recommendation.image}
            fallbackSiteName={recommendation.siteName}
          />

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
          </div>
        </section>

        <QRCodeCard
          url={`https://goodshare-app.vercel.app/go/${id}/${recommendationId}`}
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