// Step 4: Practical Constraints (Vehicle Type + Budget)
function ConstraintsStep({ preferences, onUpdate, error }) {
  const { vehicleType, rvDetails, budgetComfort } = preferences;

  const budgetLabels = {
    1: 'Thrifty',
    2: 'Balanced',
    3: 'Splurge',
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-gray-100">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold text-charcoal mb-2">
          Practical Details
        </h2>
        <p className="text-sm text-gray-500">
          So we don't send your RV under a low bridge.
        </p>
      </div>

      <div className="space-y-8">
        {/* Vehicle Type */}
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">
            Primary Vehicle
          </span>
          <div className="flex gap-4">
            {['car', 'ev', 'rv'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onUpdate({ vehicleType: type })}
                className={`flex-1 py-3 border-2 rounded-xl font-medium transition-all capitalize focus:outline-none focus:ring-2 focus:ring-moss/50 ${
                  vehicleType === type
                    ? 'border-moss bg-moss/5 text-moss'
                    : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
                aria-label={`Select ${type} as vehicle type`}
              >
                {type === 'ev' ? 'EV' : type === 'rv' ? 'RV/Tow' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional RV Fields */}
        {vehicleType === 'rv' && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-4 animate-in fade-in duration-300">
            <div>
              <label
                htmlFor="rv-height"
                className="text-xs font-semibold text-gray-500 mb-1 block"
              >
                Height Clearance
              </label>
              <select
                id="rv-height"
                value={rvDetails?.heightClearance || ''}
                onChange={(e) =>
                  onUpdate({
                    rvDetails: { ...rvDetails, heightClearance: e.target.value },
                  })
                }
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-moss transition-colors"
                aria-label="RV height clearance"
              >
                <option value="">Select height</option>
                <option value="under-8">Under 8'</option>
                <option value="8-10">8' - 10'</option>
                <option value="10-12">10' - 12'</option>
                <option value="over-12">Over 12'</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="rv-length"
                className="text-xs font-semibold text-gray-500 mb-1 block"
              >
                Total Length
              </label>
              <select
                id="rv-length"
                value={rvDetails?.totalLength || ''}
                onChange={(e) =>
                  onUpdate({
                    rvDetails: { ...rvDetails, totalLength: e.target.value },
                  })
                }
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-moss transition-colors"
                aria-label="RV total length"
              >
                <option value="">Select length</option>
                <option value="under-20">Under 20'</option>
                <option value="20-30">20' - 30'</option>
                <option value="over-30">Over 30'</option>
              </select>
            </div>
          </div>
        )}

        {/* Budget Slider */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Budget Comfort
            </span>
            <span className="text-xs font-medium text-moss">
              {budgetLabels[budgetComfort] || 'Balanced'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            value={budgetComfort}
            onChange={(e) => onUpdate({ budgetComfort: parseInt(e.target.value, 10) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
            aria-label="Budget comfort level"
            aria-valuenow={budgetComfort}
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuetext={budgetLabels[budgetComfort]}
          />
          <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-medium uppercase">
            <span>Thrifty</span>
            <span>Balanced</span>
            <span>Splurge</span>
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

export default ConstraintsStep;