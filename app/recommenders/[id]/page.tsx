import { db } from "../../firebase";
import OwnerControls from "../../components/OwnerControls";
import RecommendationFilter from "../../components/RecommendationFilter";
import QRCodeCard from "../../components/QRCodeCard";
import TrustMeter from "../../components/TrustMeter";
import BadgeDisplay from "../../components/BadgeDisplay";
import ProfileOwnerCheck from "../../components/ProfileOwnerCheck";
import OwnerOnlyChecklist from "../../components/OwnerOnlyChecklist";
import OwnerSavedPicks from "../../components/OwnerSavedPicks";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

type Recommender = {
  name: string;
  role: string;
  categories: string;
  userId?: string;
  description?: string;
  createdAt?: { seconds: number };
  lastActiveAt?: { seconds: number };
  totalRatings?: number;
  totalRatingScore?: number;
  totalOutboundClickCount?: number;
  referralCount?: number;
  isBetaUser?: boolean;
};

type Recommendation = {
  id: string;
  title: string;
  description: string;
  link: string;
  category: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RecommenderPage({ params }: PageProps) {
  const { id } = await params;

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

  const recommendationsRef = collection(db, "recommenders", id, "recommendations");
  const recommendationsSnap = await getDocs(recommendationsRef);

  const recommendations: Recommendation[] = recommendationsSnap.docs.map((doc) => {
    const data = doc.data() as Omit<Recommendation, "id">;
    return { id: doc.id, ...data };
  });

  const parsedCategories = Array.from(
    new Set(
      recommendations
        .map((r) => r.category?.trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b)) as string[];

  const initials = recommender.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-black sm:px-6">
      <div className="mx-auto max-w-3xl">

        <a href="/" className="mb-8 inline-block text-sm text-gray-500 transition hover:text-black">
          Back to GoodShare
        </a>

        <OwnerOnlyChecklist
          profileUserId={recommender.userId}
          recommenderId={id}
          recommendationCount={recommendations.length}
          totalOutboundClickCount={recommender.totalOutboundClickCount ?? 0}
          totalRatings={recommender.totalRatings ?? 0}
        />

        <section className="mb-6 rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-lg font-bold text-gray-600">
                {initials}
              </div>
              <div>
                <h1 className="text-2xl font-bold leading-tight">{recommender.name}</h1>
                <p className="mt-0.5 text-sm font-medium text-gray-500">{recommender.role}</p>
                <TrustMeter recommenderId={id} />
              </div>
            </div>

            <div className="flex gap-6 sm:flex-col sm:items-end sm:gap-2">
              <div className="text-center sm:text-right">
                <p className="text-2xl font-bold">{recommendations.length}</p>
                <p className="text-xs text-gray-500">Picks</p>
              </div>
            </div>
          </div>

          {recommender.description && (
            <div className="mt-5 border-t border-gray-100 pt-4">
              <p className="text-sm leading-6 text-gray-600">{recommender.description}</p>
            </div>
          )}

          <BadgeDisplay
            recommenderId={id}
            recommenderData={{
              name: recommender.name,
              role: recommender.role,
              description: recommender.description,
              createdAt: recommender.createdAt,
              lastActiveAt: recommender.lastActiveAt,
              totalRatings: recommender.totalRatings,
              totalRatingScore: recommender.totalRatingScore,
              totalOutboundClickCount: recommender.totalOutboundClickCount,
              referralCount: recommender.referralCount,
              isBetaUser: recommender.isBetaUser,
            }}
            recommendationCount={recommendations.length}
          />

          <div className="mt-5">
            <OwnerControls
              type="profile"
              profileUserId={recommender.userId}
              recommenderId={id}
            />
          </div>
        </section>

        <QRCodeCard url={`https://goodshare-app.vercel.app/recommenders/${id}`} />

        <ProfileOwnerCheck
          profileUserId={recommender.userId}
          recommenderId={id}
          recommendations={recommendations}
          categories={parsedCategories}
          recommenderName={recommender.name}
        />

        {/* Saved picks — only visible to owner */}
        <OwnerSavedPicks profileUserId={recommender.userId} />

      </div>
    </main>
  );
}