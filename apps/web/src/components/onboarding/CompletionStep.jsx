// Step 7: Completion screen
function CompletionStep({ onPlanTrip, onEditPreferences }) {
  return (
    <div className="text-center p-8 max-w-md mx-auto">
      <div
        className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"
        role="img"
        aria-label="Success checkmark"
      >
        <i className="ph-bold ph-check text-4xl" aria-hidden="true" />
      </div>

      <h2 className="font-display text-4xl font-semibold text-charcoal mb-4">
        You're all set.
      </h2>
      <p className="text-gray-600 mb-10 leading-relaxed">
        We've customized the map engine to match your style.
        <br />
        Your adventure begins now.
      </p>

      <button
        onClick={onPlanTrip}
        className="w-full bg-moss text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-moss-light transition-all shadow-xl shadow-moss/20 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-moss/50"
        aria-label="Plan my first trip"
      >
        Plan My First Trip{' '}
        <i className="ph-bold ph-arrow-right" aria-hidden="true" />
      </button>

      <button
        onClick={onEditPreferences}
        className="mt-6 text-sm font-medium text-gray-500 hover:text-moss underline decoration-transparent hover:decoration-moss transition-all focus:outline-none focus:ring-2 focus:ring-moss/20 rounded"
        aria-label="Edit preferences"
      >
        I want to edit my preferences first
      </button>
    </div>
  );
}

export default CompletionStep;