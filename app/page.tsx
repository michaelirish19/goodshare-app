import AuthStatus from "./components/AuthStatus";
import HomepageActions from "./components/HomepageActions";
import JoinGoodShareButton from "./components/JoinGoodShareButton";
import HomeDirectory from "./components/HomeDirectory";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white px-4 py-10 text-black sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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

          <div className="flex flex-wrap items-center gap-3 md:justify-end">
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