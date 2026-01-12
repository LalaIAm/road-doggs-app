import {
  ArrowRightIcon,
  CarIcon,
  TentIcon,
  MountainsIcon,
  BinocularsIcon,
  MapPinIcon,
  UsersIcon,
  StarIcon,
  CoffeeIcon,
  CameraIcon,
} from "@phosphor-icons/react";

function HeroSection() {
  return (
    <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        {/* Left: Copy */}
        <div className="lg:col-span-5 flex flex-col gap-8 z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200 w-fit">
            <span className="w-2 h-2 rounded-full bg-ochre animate-pulse"></span>
            <span className="text-xs font-semibold tracking-wide uppercase text-gray-500">
              The New Standard
            </span>
          </div>

          <h1 className="font-display font-medium text-5xl lg:text-7xl leading-[1.1] text-charcoal">
            Plan road trips that{" "}
            <span className="italic font-serif text-moss">actually</span> fit
            you.
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed max-w-md">
            AI-powered road trip planning with personalized routes, hidden gems,
            and real-time collaboration—built for the way people really travel.
          </p>

          <div className="flex items-center gap-6 mt-2">
            <a
              href="#"
              className="bg-moss text-white px-8 py-4 rounded-full font-medium inline-flex items-center gap-2 hover:bg-moss-light transition-all shadow-xl shadow-moss/20"
            >
              Plan Your Trip <ArrowRightIcon weight="fill" />
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-moss font-medium underline decoration-gray-300 underline-offset-4"
            >
              See how it works
            </a>
          </div>

          {/* Trust Indicator */}
          <div className="pt-8 border-t border-gray-200 mt-4">
            <p className="text-sm font-medium text-gray-500 mb-3">
              Trusted by modern explorers
            </p>
            <div className="flex gap-4 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <CarIcon weight="fill" className="text-2xl" />
              <TentIcon weight="fill" className="text-2xl" />
              <MountainsIcon weight="fill" className="text-2xl" />
              <BinocularsIcon weight="fill" className="text-2xl" />
              <BinocularsIcon weight="fill" className="text-2xl" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-7 relative h-full min-h-[500px]">

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-green-100 to-orange-50 rounded-full blur-3xl -z-10 opacity-60"></div>

          {/* Main Landscape card */}
          <div className="relative w-full aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl floating">
            <img
              src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2021&q=80"
              alt="scenic road trip route"
              className="object-cover w-full h-full"
            />

            {/* UI Overlay: Route Planner */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
              <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-3">
                <MapPinIcon className="text-ochre text-xl" />
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Current Leg
                  </p>
                  <p className="text-sm font-semibold text-charcoal">
                    Big Sur Highway 1
                  </p>
                </div>
              </div>
              <div className="glass-panel p-2 rounded-full">
                <div className="w-8 h-8 rounded-full bg-moss flex items-center justify-center text-white">
                  <UsersIcon />
                </div>
              </div>
            </div>

            {/* UI Overlay: POI Card */}
            <div className="absolute bottom-8 right-8 w-64 glass-panel p-4 rounded-3xl floating-delayed">
              <div className="flex gap-3 mb-3">
                <img
                  src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
                  alt="Coffee"
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <h4 className="font-bold text-sm text-charcoal">
                    Coastal Brews
                  </h4>
                  <p className="text-xs text-green-700 flex items-center gap-1">
                    <StarIcon /> 4.9 • Hidden Gem
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] px-2 py-1 bg-white rounded-md text-gray-600 border border-gray-100">
                  Locals Only
                </span>
                <span className="text-[10px] px-2 py-1 bg-white rounded-md text-gray-600 border border-gray-100">
                  Dog Friendly
                </span>
              </div>
              <button className="w-full mt-3 bg-charcoal text-white text-xs py-2 rounded-xl font-medium">
                Add to Route
              </button>
            </div>

            {/* Map Pins */}
            <div className="absolute top-1/3 left-1/3 p-2 bg-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform">
              <CoffeeIcon weight="fill" className="text-ochre" />
            </div>
            <div className="absolute top-1/2 right-1/4 p-2 bg-white rounded-full shadow-lg transform cursor-pointer hover:scale-110 transition-transform">
              <CameraIcon weight="fill" className="text-moss" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeroSection;
