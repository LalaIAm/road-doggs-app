function HowItWorksSection() {
  return (
    <section className="py-24 px-6 bg-sand" id="how-it-works">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-display text-4xl font-medium text-charcoal">
            From idea to ignition in minutes.
          </h2>
        </div>

        <div className="grid lg:grid-cols-4 gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-8 left-0 w-full h-0.5 bg-gray-300 -z-10"></div>

          {/* Step 1 */}
          <div className="relative pt-8">
            <div className="w-16 h-16 bg-moss text-white rounded-full flex items-center justify-center text-xl font-bold border-4 border-sand mb-6 mx-auto lg:mx-0">
              1
            </div>
            <h4 className="font-display font-bold text-lg mb-2 text-center lg:text-left">Set Preferences</h4>
            <p className="text-gray-600 text-sm text-center lg:text-left">
              Define your pace, your interests, and your vehicle type.
            </p>
          </div>
          
          {/* Step 2 */}
          <div className="relative pt-8">
            <div className="w-16 h-16 bg-white text-moss rounded-full flex items-center justify-center text-xl font-bold border-4 border-sand mb-6 mx-auto lg:mx-0 shadow-sm">
              2
            </div>
            <h4 className="font-display font-bold text-lg mb-2 text-center lg:text-left">Build Route</h4>
            <p className="text-gray-600 text-sm text-center lg:text-left">
              Select endpoints. Watch AI generate the perfect wavy line.
            </p>
          </div>
          
          {/* Step 3 */}
          <div className="relative pt-8">
            <div className="w-16 h-16 bg-white text-moss rounded-full flex items-center justify-center text-xl font-bold border-4 border-sand mb-6 mx-auto lg:mx-0 shadow-sm">
              3
            </div>
            <h4 className="font-display font-bold text-lg mb-2 text-center lg:text-left">Fill the Gaps</h4>
            <p className="text-gray-600 text-sm text-center lg:text-left">
              Drag and drop recommended stops and hidden gems.
            </p>
          </div>
          
          {/* Step 4 */}
          <div className="relative pt-8">
            <div className="w-16 h-16 bg-white text-moss rounded-full flex items-center justify-center text-xl font-bold border-4 border-sand mb-6 mx-auto lg:mx-0 shadow-sm">
              4
            </div>
            <h4 className="font-display font-bold text-lg mb-2 text-center lg:text-left">Drive</h4>
            <p className="text-gray-600 text-sm text-center lg:text-left">
              Sync to offline mode and hit the gas.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
