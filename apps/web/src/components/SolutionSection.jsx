import { MagicWandIcon, PathIcon, WifiSlashIcon } from '@phosphor-icons/react'
import { useScrollReveal } from '../hooks/useScrollReveal'

function SolutionSection() {
  const revealRef = useScrollReveal()

  return (
    <section className="py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative rounded-[3rem] overflow-hidden h-[600px] reveal" ref={revealRef}>
            <img 
              src="https://images.unsplash.com/photo-1758272960281-46b65da6336c?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
              alt="Friends looking at map" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="absolute bottom-8 left-8 text-white">
              <p className="font-display text-2xl font-medium">"RoadDoggs saved our Southwest trip."</p>
            </div>
          </div>
          
          <div className="order-1 lg:order-2 reveal" ref={revealRef}>
            <span className="text-ochre font-semibold tracking-wider text-sm uppercase mb-4 block">The Ecosystem</span>
            <h2 className="font-display text-5xl font-medium mb-8 leading-tight">
              One intelligent planning space for the open road.
            </h2>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <span className="w-6 h-6 rounded-full bg-moss/10 flex items-center justify-center text-moss mt-1 shrink-0">
                  <MagicWandIcon weight="fill" />
                </span>
                <div>
                  <h4 className="font-semibold text-lg text-charcoal">Personalized from the start</h4>
                  <p className="text-gray-600 mt-1">We don't ask "where are you going?", we ask "how do you want to feel?"</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="w-6 h-6 rounded-full bg-moss/10 flex items-center justify-center text-moss mt-1 shrink-0">
                  <PathIcon weight="fill" />
                </span>
                <div>
                  <h4 className="font-semibold text-lg text-charcoal">Route-First Logic</h4>
                  <p className="text-gray-600 mt-1">Built around the journey, not just the destination pins.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="w-6 h-6 rounded-full bg-moss/10 flex items-center justify-center text-moss mt-1 shrink-0">
                  <WifiSlashIcon   weight="fill" />
                </span>
                <div>
                  <h4 className="font-semibold text-lg text-charcoal">Signal Optional</h4>
                  <p className="text-gray-600 mt-1">Full functionality offline. Because the best spots usually have zero bars.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SolutionSection
