import HomeDirectory from "../components/HomeDirectory";

export default function DiscoverPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white px-4 py-10 text-black sm:px-6">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="mb-8 inline-block text-sm text-gray-500 transition hover:text-black">
          ← Back to GoodShare
        </a>
        <div className="mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Browse
          </p>
          <h1 className="text-4xl font-bold tracking-tight">Discover</h1>
          <p className="mt-3 text-lg text-gray-600">
            Find people who share what they actually use and trust.
          </p>
        </div>
        <HomeDirectory />
      </div>
    </main>
  );
}