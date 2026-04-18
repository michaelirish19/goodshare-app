import AuthStatus from "./components/AuthStatus";
import HomepageActions from "./components/HomepageActions";
import JoinGoodShareButton from "./components/JoinGoodShareButton";
import TopSharers from "./components/TopSharers";
import ActivityFeed from "./components/ActivityFeed";
import LiveStats from "./components/LiveStats";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white px-4 py-10 text-black sm:px-6">
      <div className="mx-auto max-w-3xl">

        <header className="mb-12 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">GoodShare</span>
          <div className="flex flex-wrap items-center gap-3">
            <a href="/discover" className="text-sm font-medium text-gray-600 transition hover:text-black">
              Discover
            </a>
            <JoinGoodShareButton />
            <AuthStatus />
          </div>
        </header>

        <section className="mb-14">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Trusted recommendations
          </p>
          <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-black sm:text-5xl md:text-6xl">
            Recommendations<br />from real&nbsp;people.
          </h1>
          <p className="mb-8 max-w-xl text-lg leading-relaxed text-gray-600">
            Discover tools, products, and resources recommended by people who actually use them.
          </p>

          {/* Live stats */}
          <LiveStats />

          <div className="mb-8 rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">How it works</p>
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
              <div className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-300 text-xs font-semibold text-gray-500">1</span>
                <div><p className="text-sm font-semibold">Build your list</p><p className="mt-0.5 text-xs leading-5 text-gray-500">Paste a link. Saved in seconds.</p></div>
              </div>
              <div className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-300 text-xs font-semibold text-gray-500">2</span>
                <div><p className="text-sm font-semibold">Share it anywhere</p><p className="mt-0.5 text-xs leading-5 text-gray-500">Profile link or QR code. Every click tracked.</p></div>
              </div>
              <div className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-300 text-xs font-semibold text-gray-500">3</span>
                <div><p className="text-sm font-semibold">Get rated & rewarded</p><p className="mt-0.5 text-xs leading-5 text-gray-500">Build your reputation. Earn real money.</p></div>
              </div>
            </div>
          </div>

          <HomepageActions />
        </section>

        <TopSharers />
        <ActivityFeed />

      </div>
    </main>
  );
}