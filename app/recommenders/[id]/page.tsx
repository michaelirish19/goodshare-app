import { db } from "../../firebase";
import OwnerControls from "../../components/OwnerControls";
import RecommendationCardQR from "../../components/RecommendationCardQR";
import QRCodeCard from "../../components/QRCodeCard";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

type Recommender = {
  name: string;
  role: string;
  categories: string;
  userId?: string;
  description?: string;
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
            ← Back to GoodShare
          </a>
          <h1 className="text-2xl font-bold">Recommender not found</h1>
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

  const groupedRecommendations = recommendations.reduce(
    (groups, item) => {
      const category = item.category?.trim() || "Uncategorized";
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
      return groups;
    },
    {} as Record<string, Recommendation[]>
  );

  const sortedCategoryEntries = Object.entries(groupedRecommendations)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([category, items]) =>
        [category, [...items].sort((a, b) => a.title.localeCompare(b.title))] as const
    );

  const parsedCategories = recommender.categories
    .split("•")
    .map((c) => c.trim())
    .filter(Boolean);

  const initials = recommender.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-black sm:px-6">
      <div className="mx-auto max-w-3xl">

        {/* Back link */}
        <a href="/" className="mb-8 inline-block text-sm text-gray-500 transition hover:text-black">
          ← Back to GoodShare
        </a>

        {/* Profile header */}
        <section className="mb-6 rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

            {/* Left: identity */}
            <div className="flex items-start gap-4">
              {/* Initials avatar */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-lg font-bold text-gray-600">
                {initials}
              </div>

              <div>
                <h1 className="text-2xl font-bold leading-tight">{recommender.name}</h1>
                <p className="mt-0.5 text-sm font-medium text-gray-500">{recommender.role}</p>

                {/* Trust meter placeholder */}
                <div className="mt-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Trust rating
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-36 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full w-0 rounded-full bg-gray-300" />
                    </div>
                    <span className="text-xs text-gray-400">No ratings yet</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: stats */}
            <div className="flex gap-6 sm:flex-col sm:items-end sm:gap-2">
              <div className="text-center sm:text-right">
                <p className="text-2xl font-bold">{recommendations.length}</p>
                <p className="text-xs text-gray-500">Recommendations</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {recommender.description && (
            <div className="mt-5 border-t border-gray-100 pt-4">
              <p className="text-sm leading-6 text-gray-600">{recommender.description}</p>
            </div>
          )}

          {/* Category tags */}
          {parsedCategories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {parsedCategories.map((category) => (
                <a
                  key={category}
                  href={`/?category=${encodeURIComponent(category)}`}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  {category}
                </a>
              ))}
            </div>
          )}

          {/* Owner: Add recommendation button */}
          <div className="mt-5">
            <OwnerControls
              type="profile"
              profileUserId={recommender.userId}
              recommenderId={id}
            />
          </div>
        </section>

        {/* QR code for profile sharing */}
        <QRCodeCard url={`https://goodshare-app.vercel.app/recommenders/${id}`} />

        {/* Recommendations */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Recommendations</h2>
            <span className="text-sm text-gray-400">{recommendations.length} total</span>
          </div>

          {recommendations.length > 0 ? (
            <div className="space-y-8">
              {sortedCategoryEntries.map(([category, items]) => (
                <div key={category}>

                  {/* Category header */}
                  <div className="mb-3 flex items-center gap-3">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                      {category}
                    </h3>
                    <div className="h-px flex-1 bg-gray-100" />
                    <span className="text-xs text-gray-400">{items.length}</span>
                  </div>

                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-gray-200 p-5 transition hover:border-gray-300 hover:shadow-sm"
                      >
                        {/* Card header */}
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h4 className="text-base font-semibold leading-snug">
                            <a
                              href={`/recommenders/${id}/recommendations/${item.id}`}
                              className="hover:underline"
                            >
                              {item.title}
                            </a>
                          </h4>

                          {/* Primary action: outbound link */}
                          <a
                            href={`/out/${id}/${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white transition hover:opacity-80"
                          >
                            View →
                          </a>
                        </div>

                        {/* Description */}
                        {item.description && (
                          <p className="mb-4 text-sm leading-6 text-gray-600">
                            {item.description}
                          </p>
                        )}

                        {/* Secondary actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={`/recommenders/${id}/recommendations/${item.id}`}
                            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                          >
                            Details
                          </a>

                          <RecommendationCardQR
                            url={`https://goodshare-app.vercel.app/go/${id}/${item.id}`}
                          />

                          <OwnerControls
                            type="recommendation"
                            profileUserId={recommender.userId}
                            recommenderId={id}
                            recommendationId={item.id}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center">
              <p className="text-sm font-medium text-gray-400">No recommendations yet.</p>
              <p className="mt-1 text-xs text-gray-400">Check back soon.</p>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}