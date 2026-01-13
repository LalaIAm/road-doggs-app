// Step 6: Optional AI Refinement
import { useState } from 'react';
import PrivacyNotice from './PrivacyNotice';

function AIRefinementStep({
  preferences,
  privacyConsent,
  aiRefinementText,
  suggestedPreferences,
  onUpdate,
  onConsentChange,
  onRefineWithAI,
  onAcceptSuggestions,
  onRejectSuggestions,
  isLoading,
  error,
}) {
  const [localText, setLocalText] = useState(aiRefinementText || '');

  const suggestedChips = [
    'Avoid toll roads',
    'Dog friendly everywhere',
    'Late riser',
  ];

  const handleChipClick = (chip) => {
    const newText = localText
      ? `${localText} ${chip.toLowerCase()}`
      : chip.toLowerCase();
    setLocalText(newText);
    onUpdate({ aiRefinementText: newText });
  };

  const handleRefineClick = () => {
    if (!privacyConsent) {
      return;
    }
    onRefineWithAI(localText);
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-gray-100">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ochre/10 text-ochre text-xs font-bold uppercase tracking-wide mb-4">
          <i className="ph-fill ph-sparkle" aria-hidden="true" /> Optional
        </div>
        <h2 className="font-display text-2xl font-semibold text-charcoal mb-2">
          Anything else we should know?
        </h2>
        <p className="text-sm text-gray-500">
          Tell the AI specific things you love or hate.
        </p>
      </div>

      {/* Privacy Notice */}
      <PrivacyNotice
        privacyConsent={privacyConsent}
        onConsentChange={onConsentChange}
        error={!privacyConsent && error ? 'Consent required for AI refinement' : null}
      />

      {/* AI Input (only if consented) */}
      {privacyConsent && (
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-300 to-amber-300 rounded-2xl opacity-20 blur transition duration-1000 group-hover:opacity-60 group-hover:duration-200" />
          <div className="relative bg-white rounded-xl">
            <textarea
              placeholder="e.g. 'I love scenic backroads, hate crowds, and need good coffee stops every 2 hours.'"
              value={localText}
              onChange={(e) => {
                setLocalText(e.target.value);
                onUpdate({ aiRefinementText: e.target.value });
              }}
              className="w-full h-40 p-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-moss/20 resize-none font-sans text-gray-700 leading-relaxed"
              aria-label="AI refinement text input"
            />
          </div>
        </div>
      )}

      {/* Suggested Chips */}
      {privacyConsent && (
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {suggestedChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full cursor-pointer hover:bg-moss/10 hover:text-moss transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-moss/20"
              aria-label={`Add suggestion: ${chip}`}
            >
              "{chip}"
            </button>
          ))}
        </div>
      )}

      {/* AI Refinement Button */}
      {privacyConsent && (
        <button
          type="button"
          onClick={handleRefineClick}
          disabled={isLoading || !localText.trim()}
          className="mt-6 w-full bg-moss text-white px-8 py-3.5 rounded-full font-medium hover:bg-moss-light transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-moss/50"
          aria-label={isLoading ? 'Refining preferences...' : 'Refine preferences with AI'}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Refining...
            </>
          ) : (
            <>
              Use AI Refinement <i className="ph-bold ph-sparkle" aria-hidden="true" />
            </>
          )}
        </button>
      )}

      {/* Suggested Preferences Display */}
      {suggestedPreferences && (
        <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-xl">
          <h3 className="font-semibold text-charcoal mb-2">
            AI Suggestions Available
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            We've refined your preferences based on your input. Review and accept or
            continue with your original choices.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Accept AI suggestions and update your preferences?')) {
                  onAcceptSuggestions();
                }
              }}
              className="flex-1 bg-moss text-white px-4 py-2 rounded-lg font-medium hover:bg-moss-light transition-colors focus:outline-none focus:ring-2 focus:ring-moss/50"
              aria-label="Accept AI suggestions"
            >
              Accept Suggestions
            </button>
            <button
              type="button"
              onClick={onRejectSuggestions}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400/50"
              aria-label="Keep original preferences"
            >
              Keep Original
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && privacyConsent && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800" role="alert">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}

export default AIRefinementStep;