// Step 5: Collaboration (Travel companions)
function CollaborationStep({ preferences, onUpdate, error }) {
  const { collaboration, isMainPlanner } = preferences;

  const collaborationOptions = [
    { id: 'solo', label: 'Just me', icon: 'ph-user' },
    { id: 'friends', label: 'Friends / Group', icon: 'ph-users-three' },
    { id: 'family', label: 'Family', icon: 'ph-baby' },
  ];

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-gray-100">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold text-charcoal mb-2">
          Who are you traveling with?
        </h2>
        <p className="text-sm text-gray-500">
          We'll set up the right collaborative workspace.
        </p>
      </div>

      <div className="space-y-4">
        {collaborationOptions.map((option) => (
          <label
            key={option.id}
            className={`group flex items-center justify-between p-5 border-2 rounded-2xl cursor-pointer transition-all hover:border-moss ${
              collaboration === option.id
                ? 'border-moss bg-sand/30'
                : 'border-gray-200 hover:bg-sand/30'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  collaboration === option.id
                    ? 'bg-moss text-white'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-moss group-hover:text-white'
                }`}
              >
                <i className={`ph-fill ${option.icon}`} aria-hidden="true" />
              </div>
              <span className="font-medium text-charcoal">{option.label}</span>
            </div>
            <input
              type="radio"
              name="collaboration"
              value={option.id}
              checked={collaboration === option.id}
              onChange={(e) => onUpdate({ collaboration: e.target.value })}
              className="w-5 h-5 accent-moss focus:ring-2 focus:ring-moss/20 cursor-pointer"
              aria-label={`Select ${option.label} as travel companion option`}
            />
          </label>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={isMainPlanner}
            onChange={(e) => onUpdate({ isMainPlanner: e.target.checked })}
            className="w-5 h-5 accent-moss rounded border-gray-300 focus:ring-2 focus:ring-moss/20 cursor-pointer"
            aria-label="I'm usually the main planner"
          />
          <span className="text-sm text-gray-600 font-medium">
            I'm usually the main planner
          </span>
        </label>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default CollaborationStep;