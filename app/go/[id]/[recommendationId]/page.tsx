import { db } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import GoRedirectClient from "../../../components/GoRedirectClient";

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

export default async function GoPage({ params }: PageProps) {
  const { id, recommendationId } = await params;

  const recommenderRef = doc(db, "recommenders", id);
  const recommenderSnap = await getDoc(recommenderRef);

  const recommendationRef = doc(
    db,
    "recommenders",
    id,
    "recommendations",
    recommendationId
  );
  const recommendationSnap = await getDoc(recommendationRef);

  if (!recommenderSnap.exists() || !recommendationSnap.exists()) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-black">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold">Pick not found</h1>
          <p className="mt-2 text-sm text-gray-600">
            This pick may have been removed or the link may be invalid.
          </p>
          <a
            href="/"
            className="mt-6 inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Back to GoodShare
          </a>
        </div>
      </main>
    );
  }

  const recommender = recommenderSnap.data() as Recommender;
  const recommendation = recommendationSnap.data() as Recommendation;

  return (
    <GoRedirectClient
      recommenderId={id}
      recommendationId={recommendationId}
      recommenderName={recommender.name}
      recommenderRole={recommender.role}
      recommendationTitle={recommendation.title}
      category={recommendation.category}
    />
  );
}