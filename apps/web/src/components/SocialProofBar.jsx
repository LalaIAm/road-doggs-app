import { CheckCircleIcon } from '@phosphor-icons/react'

function SocialProofBar() {
  return (
    <section className="border-y border-gray-200 bg-white py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 items-center text-gray-500 font-medium">
          <span className="uppercase tracking-widest text-xs font-bold text-gray-400">Built for real travel</span>
          <span className="flex items-center gap-2">
            <CheckCircleIcon weight="fill" className="text-moss" /> Offline-ready
          </span>
          <span className="flex items-center gap-2">
            <CheckCircleIcon weight="fill" className="text-moss" /> RV-safe routing
          </span>
          <span className="flex items-center gap-2">
            <CheckCircleIcon weight="fill" className="text-moss" /> Multi-user collaboration
          </span>
        </div>
      </div>
    </section>
  )
}

export default SocialProofBar
