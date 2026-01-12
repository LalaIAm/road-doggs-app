import { useScrollReveal } from '../hooks/useScrollReveal'

function FeaturesSection() {
  const revealRef1 = useScrollReveal()
  const revealRef2 = useScrollReveal()

  return (
    <section className="py-24 px-6 bg-white" id="features">
      <div className="max-w-7xl mx-auto space-y-32">
        
        {/* Feature 1 */}
        <div className="grid lg:grid-cols-2 gap-16 items-center reveal" ref={revealRef1}>
          <div>
            <span className="inline-block py-1 px-3 rounded-full bg-sand-dark text-xs font-semibold uppercase tracking-wider mb-6 text-charcoal">
              AI Intelligence
            </span>
            <h3 className="font-display text-4xl font-medium mb-6">
              Routes that know you better than you do.
            </h3>
            <p className="text-lg text-gray-600 mb-8">
              Tell RoadDoggs you love vintage shops and hate highways. The AI builds a custom itinerary balancing drive time with exploration time.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="font-semibold text-moss mb-1">Scenic vs Efficient</p>
                <p className="text-xs text-gray-500">Toggle sliders to adjust your vibe.</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="font-semibold text-moss mb-1">Elevation Aware</p>
                <p className="text-xs text-gray-500">Crucial for RVs and towing.</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 rounded-[2.5rem] h-[500px] w-full overflow-hidden relative group">
            <img 
              src="https://images.unsplash.com/photo-1637633059043-949f40c73784?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              alt="Scenic Route"
            />
            <div className="absolute bottom-8 right-8 glass-panel p-4 rounded-2xl max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded">Match: 98%</span>
              </div>
              <p className="text-sm font-medium">"This route adds 20 mins but passes 3 highly rated antique stores."</p>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="grid lg:grid-cols-2 gap-16 items-center reveal" ref={revealRef2}>
          <div className="lg:order-2">
            <span className="inline-block py-1 px-3 rounded-full bg-sand-dark text-xs font-semibold uppercase tracking-wider mb-6 text-charcoal">
              Discovery
            </span>
            <h3 className="font-display text-4xl font-medium mb-6">
              Find the hidden gems standard maps miss.
            </h3>
            <p className="text-lg text-gray-600 mb-8">
              No more tourist traps. Discover local food, small quirky attractions, and off-the-beaten-path overlooks that fit perfectly into your timeline.
            </p>
            <a href="#" className="text-moss font-medium underline decoration-moss/30 hover:decoration-moss underline-offset-4">
              Explore discovery engine
            </a>
          </div>
          <div className="lg:order-1 bg-gray-100 rounded-[2.5rem] h-[500px] w-full overflow-hidden relative group">
            <img 
              src="https://images.unsplash.com/photo-1555992336-fb0d29498b13?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YW1lcmljYW4lMjBkaW5lcnxlbnwwfHwwfHx8MA%3D%3D" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              alt="Hidden Gem Diner"
            />
            {/* Abstract Pin UI */}
            <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-moss/20 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-4 h-4 bg-moss rounded-full border-2 border-white shadow-lg"></div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

export default FeaturesSection
