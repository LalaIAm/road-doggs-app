import { TabsIcon, RoadHorizonIcon, ChatCenteredDotsIcon } from '@phosphor-icons/react'
import { useScrollReveal } from '../hooks/useScrollReveal'

function ProblemSection() {
  const revealRef1 = useScrollReveal()
  const revealRef2 = useScrollReveal(100)
  const revealRef3 = useScrollReveal(200)

  return (
    <section className="py-24 px-6 bg-sand">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-xl mb-16 reveal" ref={revealRef1}>
          <h2 className="font-display text-4xl font-medium text-charcoal mb-4">
            Planning a road trip shouldn't feel like a second job.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-3xl reveal hover:shadow-lg transition-shadow duration-300" ref={revealRef1}>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-2xl text-red-400">
              <TabsIcon weight="fill" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-3">Tab Overload</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Jumping between maps, TripAdvisor, Apple Notes, and three different group chats just to pick lunch.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-3xl reveal transition-shadow duration-300 delay-100" ref={revealRef2}>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-2xl text-yellow-500">
              <RoadHorizonIcon weight="fill" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-3">Generic Routes</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Google Maps gets you there fast, but misses the scenic overlook, the quirky roadside diner, and the calm.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-3xl reveal hover:shadow-lg transition-shadow duration-300 delay-200" ref={revealRef3}>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-2xl text-blue-400">
              <ChatCenteredDotsIcon  weight="fill" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-3">Group Chaos</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Validating opinions, losing screenshots, and the inevitable "Wait, I thought we were stopping there?"
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProblemSection
