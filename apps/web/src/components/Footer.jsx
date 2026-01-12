import { MapTrifoldIcon, InstagramLogoIcon, TwitterLogoIcon, TiktokLogoIcon } from '@phosphor-icons/react'

function Footer() {
  return (
    <footer className="bg-charcoal text-white pt-20 pb-10 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <MapTrifoldIcon weight="fill" className="text-2xl text-white" />
              <span className="font-display font-semibold text-xl tracking-wide">RoadDoggs</span>
            </div>
            <p className="text-gray-400 text-sm max-w-xs">
              Built by travelers who were tired of screenshots and bad signal.
            </p>
          </div>
          
          <div className="flex gap-16 text-sm text-gray-400">
            <div className="flex flex-col gap-4">
              <span className="text-white font-medium">Product</span>
              <a href="#" className="hover:text-ochre">Features</a>
              <a href="#" className="hover:text-ochre">Pricing</a>
              <a href="#" className="hover:text-ochre">Download</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-white font-medium">Support</span>
              <a href="#" className="hover:text-ochre">Help Center</a>
              <a href="#" className="hover:text-ochre">Privacy</a>
              <a href="#" className="hover:text-ochre">Terms</a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>&copy; 2024 RoadDoggs Inc. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <InstagramLogoIcon weight="fill" className="text-lg hover:text-white cursor-pointer" />
            <TwitterLogoIcon weight="fill" className="text-lg hover:text-white cursor-pointer" />
            <TiktokLogoIcon weight="fill" className="text-lg hover:text-white cursor-pointer" />
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
