function FinalCTA() {
  return (
    <section className="py-32 px-6 relative flex items-center justify-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80" 
          className="w-full h-full object-cover grayscale brightness-[0.7] contrast-125" 
          alt="Open Road"
        />
        <div className="absolute inset-0 bg-moss/60 mix-blend-multiply"></div>
      </div>

      <div className="relative z-10 text-center text-white max-w-2xl px-6 py-12 backdrop-blur-sm border border-white/10 rounded-3xl bg-white/5">
        <h2 className="font-display text-4xl md:text-6xl font-medium mb-6">
          Your next road trip deserves better planning.
        </h2>
        <p className="text-xl text-gray-200 mb-10">
          No credit card. No pressure. Just better trips.
        </p>
        <button className="bg-white text-moss px-10 py-4 rounded-full font-bold text-lg hover:bg-sand transition-all transform hover:-translate-y-1 shadow-2xl">
          Start Planning for Free
        </button>
      </div>
    </section>
  )
}

export default FinalCTA
