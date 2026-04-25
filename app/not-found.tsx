import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-md">

        <Link
          href="/"
          className="mb-12 inline-block text-sm text-gray-500 transition hover:text-black"
        >
          ← Back to GoodShare
        </Link>

        <div className="mt-16 text-center">
          <p className="text-8xl font-bold tracking-tight text-gray-100">404</p>

          <div className="-mt-6">
            <h1 className="text-2xl font-bold text-gray-900">
              This page doesn&apos;t exist
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              The link might be broken, the pick may have been removed, or you may have taken a wrong turn somewhere.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-80"
            >
              Go home
            </Link>
            <Link
              href="/discover"
              className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Discover sharers
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}