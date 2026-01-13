// Step 2: Travel Style (Route Vibe + Daily Pace)
function TravelStyleStep({ preferences, onUpdate, error }) {
  const { routeVibe, dailyPace } = preferences;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-gray-100">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold text-charcoal mb-2">
          How do you like to travel?
        </h2>
        <p className="text-sm text-gray-500">
          Choose what feels right, not what you think you should pick.
        </p>
      </div>

      <div className="space-y-6">
        {/* Route Vibe Section */}
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">
            Route Vibe
          </span>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { id: 'scenic', label: 'Scenic & Slow', icon: 'ph-mountains' },
              { id: 'efficient', label: 'Efficient', icon: 'ph-lightning' },
              { id: 'balanced', label: 'Balanced', icon: 'ph-scales' },
            ].map((option) => (
              <label
                key={option.id}
                className={`relative flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-2xl cursor-pointer transition-all hover:border-moss/50 bg-white h-32 ${
                  routeVibe === option.id
                    ? 'border-moss bg-moss text-white'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="routeVibe"
                  value={option.id}
                  checked={routeVibe === option.id}
                  onChange={(e) => onUpdate({ routeVibe: e.target.value })}
                  className="absolute opacity-0 w-full h-full cursor-pointer"
                  aria-label={option.label}
                />
                <i
                  className={`ph-fill ${option.icon} text-2xl transition-colors ${
                    routeVibe === option.id ? 'text-ochre' : 'text-gray-400'
                  }`}
                  aria-hidden="true"
                />
                <span className="font-medium text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Daily Pace Section */}
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">
            Daily Pace
          </span>
          <div className="flex gap-4 p-1 bg-gray-100/50 rounded-xl overflow-x-auto no-scrollbar">
            {['relaxed', 'moderate', 'packed'].map((pace) => (
              <label key={pace} className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="dailyPace"
                  value={pace}
                  checked={dailyPace === pace}
                  onChange={(e) => onUpdate({ dailyPace: e.target.value })}
                  className="peer sr-only"
                  aria-label={`Daily pace: ${pace}`}
                />
                <div className="px-4 py-3 rounded-lg text-center text-sm font-medium text-gray-500 peer-checked:bg-white peer-checked:text-moss peer-checked:shadow-sm transition-all border border-transparent peer-checked:border-gray-200 capitalize">
                  {pace}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default TravelStyleStep;