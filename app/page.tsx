import AuthStatus from "./components/AuthStatus";
import HomepageActions from "./components/HomepageActions";
import JoinGoodShareButton from "./components/JoinGoodShareButton";
import HomeDirectory from "./components/HomeDirectory";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

type Recommender = {
  id: string;
  name: string;
  role: string;
  categories: string;
  description?: string;
};

export default async function Home() {
  const querySnapshot = await getDocs(collection(db, "recommenders"));

  const recommenders: Recommender[] = querySnapshot.docs.map((doc) => {
    const data = doc.data() as Omit<Recommender, "id">;

    return {
      id: doc.id,
      ...data,
    };
  });

  const allCategories = Array.from(
    new Set(
      recommenders.flatMap((recommender) =>
        recommender.categories
          .split("•")
          .map((category) => category.trim())
          .filter(Boolean)
      )
    )
  ).sort((a, b) => a.localeCompare(b));

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">GoodShare</h1>
            <p className="mt-3 text-lg text-gray-700">
              Recommendations from real people.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Discover tools, products, and resources recommended by people who
              actually use them.
            </p>
          </div>

          <div className="flex items-center gap-3">
  <JoinGoodShareButton />
  <AuthStatus />
</div>
        </header>

        <HomepageActions />

        <HomeDirectory
          recommenders={recommenders}
          categories={allCategories}
        />
      </div>
    </main>
  );
}