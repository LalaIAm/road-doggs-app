import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import SocialProofBar from '../components/SocialProofBar'
import ProblemSection from '../components/ProblemSection'
import SolutionSection from '../components/SolutionSection'
import FeaturesSection from '../components/FeaturesSection'
import PersonasSection from '../components/PersonasSection'
import HowItWorksSection from '../components/HowItWorksSection'
import FinalCTA from '../components/FinalCTA'
import Footer from '../components/Footer'

function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <SocialProofBar />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <PersonasSection />
      <HowItWorksSection />
      <FinalCTA />
      <Footer />
    </div>
  )
}

export default LandingPage
