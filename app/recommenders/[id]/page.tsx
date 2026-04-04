import { db } from "../../firebase";
import OwnerControls from "../../components/OwnerControls";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import QRCodeCard from "../../components/QRCodeCard";

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

  const recommendationsRef = collection(
    db,
    "recommenders",
    id,
    "recommendations"
  );
  const recommendationsSnap = await getDocs(recommendationsRef);

  const recommendations: Recommendation[] = recommendationsSnap.docs.map(
    (doc) => {
      const data = doc.data() as Omit<Recommendation, "id">;

      return {
        id: doc.id,
        ...data,
      };
    }
  );

  const groupedRecommendations = recommendations.reduce(
    (groups, item) => {
      const category = item.category?.trim() || "Uncategorized";

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push(item);
      return groups;
    },
    {} as Record<string, Recommendation[]>
  );

  const sortedCategoryEntries = Object.entries(groupedRecommendations)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([category, items]) =>
        [
          category,
          [...items].sort((a, b) => a.title.localeCompare(b.title)),
        ] as const
    );

  const parsedCategories = recommender.categories
    .split("•")
    .map((category) => category.trim())
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-3xl">
        <a
          href="/"
          className="mb-6 inline-block text-sm text-gray-600 underline"
        >
          ← Back to Directory
        </a>

        <section className="rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-3xl font-bold">{recommender.name}</h1>

          <p className="mt-2 text-sm font-medium text-gray-600">
            {recommender.role}
          </p>

          {recommender.description && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                About
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                {recommender.description}
              </p>
            </div>
          )}

          {parsedCategories.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {parsedCategories.map((category) => (
                <a
                  key={category}
                  href={`/?category=${encodeURIComponent(category)}`}
                  className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700 transition hover:bg-gray-100"
                >
                  {category}
                </a>
              ))}
            </div>
          )}
        </section>

        <QRCodeCard url={`https://goodshare-app.vercel.app/recommenders/${id}`} />

        <OwnerControls
          type="profile"
          profileUserId={recommender.userId}
          recommenderId={id}
        />

        <section className="mt-8 rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Recommendations</h2>

          {recommendations.length > 0 ? (
            <div className="mt-4 space-y-8">
              {sortedCategoryEntries.map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold">{category}</h3>

                  <div className="mt-3 space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-gray-200 p-4"
                      >
                        <h4 className="text-lg font-semibold">{item.title}</h4>

                        <p className="mt-2 text-sm leading-6 text-gray-700">
                          {item.description}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                          >
                            View Product
                          </a>

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
            <p className="mt-3 text-sm text-gray-500">
              No recommendations added yet.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}