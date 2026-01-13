// Step 1: Welcome screen
function WelcomeStep({ onNext }) {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-soft border border-gray-100 text-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-50 rounded-full blur-3xl -z-10 opacity-60 transform translate-x-12 -translate-y-12" />
      
      <div
        className="w-16 h-16 bg-moss/10 rounded-full flex items-center justify-center mx-auto mb-6 text-moss text-2xl animate-pulse"
        role="img"
        aria-label="Welcome icon"
      >
        <i className="ph-fill ph-hand-waving" aria-hidden="true" />
      </div>
      
      <h1 className="font-display text-4xl font-semibold text-charcoal mb-4">
        Let's plan trips that <span className="italic text-ochre font-serif">actually</span> fit you.
      </h1>
      <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-md mx-auto">
        A few quick questions help us tailor routes, stops, and recommendations to
        your travel style. You can change any of this later.
      </p>
      
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={onNext}
          className="w-full md:w-auto bg-moss text-white px-10 py-4 rounded-full font-medium hover:bg-moss-light transition-all transform hover:scale-105 shadow-xl shadow-moss/20 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-moss/50"
          aria-label="Get started with onboarding"
        >
          Get Started <i className="ph-bold ph-arrow-right" aria-hidden="true" />
        </button>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <i className="ph ph-clock" aria-hidden="true" /> Takes about 2 minutes
        </span>
      </div>
    </div>
  );
}

export default WelcomeStep;