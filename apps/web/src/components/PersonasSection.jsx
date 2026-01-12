import { UserIcon, UsersThreeIcon, VanIcon, GlobeHemisphereWestIcon } from '@phosphor-icons/react'

function PersonasSection() {
  return (
    <section className="py-24 bg-charcoal text-white relative overflow-hidden">
      {/* Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-moss opacity-20 blur-[100px] rounded-full"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-medium mb-4">
            Built for every kind of wanderer.
          </h2>
          <p className="text-gray-400">Find your travel style.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Persona 1 */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors cursor-default">
            <UserIcon weight="fill" className="text-3xl text-ochre mb-4" />
            <h4 className="text-xl font-display font-medium mb-2">Solo Adventurers</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Detailed safety info and single-diner friendly stops.
            </p>
          </div>
          
          {/* Persona 2 */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors cursor-default">
            <UsersThreeIcon weight="fill" className="text-3xl text-ochre mb-4" />
            <h4 className="text-xl font-display font-medium mb-2">Families</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Bathroom break predictors and kid-friendly activity filters.
            </p>
          </div>
          
          {/* Persona 3 */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors cursor-default">
            <VanIcon weight="fill" className="text-3xl text-ochre mb-4" />
            <h4 className="text-xl font-display font-medium mb-2">RV Travelers</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Elevation gradients, clearance warnings, and parking sizes.
            </p>
          </div>
          
          {/* Persona 4 */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors cursor-default">
            <GlobeHemisphereWestIcon weight="fill" className="text-3xl text-ochre mb-4" />
            <h4 className="text-xl font-display font-medium mb-2">Local Explorers</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Deep cuts in your own backyard for weekend warriors.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PersonasSection
