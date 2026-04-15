"use client";

type Props = {
  recommenderId: string;
  recommendationCount: number;
  totalOutboundClickCount: number;
  totalRatings: number;
};

export default function OnboardingChecklist({
  recommenderId,
  recommendationCount,
  totalOutboundClickCount,
  totalRatings,
}: Props) {
  const steps = [
    {
      id: "pick",
      label: "Add your first pick",
      description: "Paste a link to something you genuinely recommend.",
      done: recommendationCount >= 1,
      href: `/add?recommenderId=${recommenderId}`,
      cta: "Add a pick →",
    },
    {
      id: "click",
      label: "Get your first click",
      description: "Share your profile or QR code and get someone to click a pick.",
      done: totalOutboundClickCount >= 1,
      href: `/recommenders/${recommenderId}`,
      cta: "View your profile →",
    },
    {
      id: "rating",
      label: "Earn your first rating",
      description: "Ask someone who bought your pick to rate you.",
      done: totalRatings >= 1,
      href: `/recommenders/${recommenderId}`,
      cta: "Share your profile →",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  // Hide completely once all steps are done
  if (allDone) return null;

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Getting started
          </p>
          <h3 className="mt-0.5 text-sm font-bold text-gray-900">
            {completedCount} of {steps.length} steps complete
          </h3>
        </div>
        {/* Progress bar */}
        <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-black transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 rounded-xl p-3 transition ${
              step.done ? "opacity-50" : "bg-white border border-gray-200"
            }`}
          >
            {/* Checkmark or circle */}
            <div
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                step.done
                  ? "bg-green-500 text-white"
                  : "border-2 border-gray-300 text-gray-400"
              }`}
            >
              {step.done ? "✓" : ""}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${step.done ? "line-through text-gray-400" : "text-gray-900"}`}>
                {step.label}
              </p>
              {!step.done && (
                <>
                  <p className="mt-0.5 text-xs leading-5 text-gray-500">
                    {step.description}
                  </p>
                  <a
                    href={step.href}
                    className="mt-2 inline-block text-xs font-semibold text-black underline underline-offset-4 hover:opacity-70"
                  >
                    {step.cta}
                  </a>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-400 text-center">
        Complete all steps to earn the 🚀 First Steps badge
      </p>
    </div>
  );
}