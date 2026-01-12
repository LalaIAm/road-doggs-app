import { MapTrifoldIcon } from '@phosphor-icons/react'
import { useNavbarScroll } from '../hooks/useNavbarScroll'

function Navbar() {
  const isScrolled = useNavbarScroll()

  return (
    <nav className={`fixed w-full z-50 top-0 left-0 px-6 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-6'}`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center glass-panel rounded-full px-8 py-3">
        <div className="flex items-center gap-2">
          <MapTrifoldIcon weight="fill" className="text-2xl text-moss" />
          <span className="font-display font-semibold text-xl tracking-tight text-moss">RoadDoggs</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-moss transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-moss transition-colors">How it Works</a>
          <a href="#pricing" className="hover:text-moss transition-colors">Pricing</a>
        </div>
        <a href="#" className="bg-moss text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-moss-light transition-all hover:scale-105">
          Start Planning
        </a>
      </div>
    </nav>
  )
}

export default Navbar
