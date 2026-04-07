import AuthStatus from "./components/AuthStatus";
import HomepageActions from "./components/HomepageActions";
import JoinGoodShareButton from "./components/JoinGoodShareButton";
import HomeDirectory from "./components/HomeDirectory";

export default function Home() {
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
        <HomeDirectory />
      </div>
    </main>
  );
}