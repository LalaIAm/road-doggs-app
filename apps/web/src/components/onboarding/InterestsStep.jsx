// Step 3: Interests (Multi-select)
function InterestsStep({ preferences, onUpdate, error }) {
  const { interests = [] } = preferences;

  const interestOptions = [
    { id: 'nature', label: 'Nature', icon: 'ph-tree' },
    { id: 'food', label: 'Local Food', icon: 'ph-bowl-food' },
    { id: 'history', label: 'History', icon: 'ph-columns' },
    { id: 'photography', label: 'Photography', icon: 'ph-camera' },
    { id: 'shopping', label: 'Shopping', icon: 'ph-shopping-bag' },
    { id: 'coffee', label: 'Coffee', icon: 'ph-coffee' },
    { id: 'museums', label: 'Museums', icon: 'ph-bank' },
    { id: 'art', label: 'Art', icon: 'ph-paint-brush' },
  ];

  const handleToggleInterest = (interestId) => {
    const newInterests = interests.includes(interestId)
      ? interests.filter((id) => id !== interestId)
      : [...interests, interestId];
    onUpdate({ interests: newInterests });
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-gray-100">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold text-charcoal mb-2">
          What sparks your interest?
        </h2>
        <p className="text-sm text-gray-500">
          We use this to find hidden gems along your route.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {interestOptions.map((option) => {
          const isSelected = interests.includes(option.id);
          return (
            <label
              key={option.id}
              className={`relative flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all hover:bg-gray-50 text-gray-600 bg-white ${
                isSelected
                  ? 'border-moss bg-sand-dark font-semibold text-charcoal'
                  : 'border-gray-200'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggleInterest(option.id)}
                className="absolute opacity-0 w-full h-full cursor-pointer"
                aria-label={`Select ${option.label} interest`}
              />
              <i
                className={`ph-fill ${option.icon} text-lg ${
                  isSelected ? 'text-moss' : 'text-gray-400'
                }`}
                aria-hidden="true"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default InterestsStep;