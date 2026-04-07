import { db } from "../../../../firebase";
import OwnerControls from "../../../../components/OwnerControls";
import QRCodeCard from "../../../../components/QRCodeCard";
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
  link: string;
  category: string;
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
          <a
            href="/"
            className="mb-6 inline-block text-sm text-gray-600 underline"
          >
            ← Back to Directory
          </a>

          <h1 className="text-2xl font-bold">Recommender not found</h1>
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
          <a
            href={`/recommenders/${id}`}
            className="mb-6 inline-block text-sm text-gray-600 underline"
          >
            ← Back to Profile
          </a>

          <h1 className="text-2xl font-bold">Recommendation not found</h1>
        </div>
      </main>
    );
  }

  const recommendation = recommendationSnap.data() as Recommendation;

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-3xl">
        <a
          href={`/recommenders/${id}`}
          className="mb-6 inline-block text-sm text-gray-600 underline"
        >
          ← Back to Profile
        </a>

        <section className="rounded-2xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Recommended by{" "}
            <a
              href={`/recommenders/${id}`}
              className="underline hover:text-black"
            >
              {recommender.name}
            </a>
          </p>

          <h1 className="mt-2 text-3xl font-bold">{recommendation.title}</h1>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700">
              {recommendation.category || "Uncategorized"}
            </span>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Why I recommend this
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              {recommendation.description}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
  href={`/out/${id}/${recommendationId}`}
  target="_blank"
  rel="noopener noreferrer"
  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
>
  View Product
</a>
          </div>
        </section>

        <QRCodeCard
  url={`https://goodshare-app.vercel.app/recommenders/${id}/recommendations/${recommendationId}`}
  title="Share this recommendation"
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