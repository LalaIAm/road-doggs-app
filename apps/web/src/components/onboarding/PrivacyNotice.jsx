// Privacy notice component with consent checkbox
function PrivacyNotice({ privacyConsent, onConsentChange, error }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
      <h3 className="font-semibold text-charcoal mb-2">Privacy & Data Usage</h3>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
        By continuing, you agree to our privacy policy. We use your travel preferences
        to personalize your experience and may use AI to refine recommendations. Your
        data is encrypted and stored securely. You can update or delete your preferences
        at any time in your profile settings.
      </p>
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={privacyConsent}
          onChange={(e) => onConsentChange(e.target.checked)}
          className="mt-0.5 w-5 h-5 accent-moss rounded border-gray-300 focus:ring-2 focus:ring-moss/20 cursor-pointer"
          aria-describedby="consent-error"
          aria-invalid={error ? 'true' : 'false'}
        />
        <span className="text-sm text-gray-700 flex-1">
          I consent to data processing and AI-powered refinement of my travel
          preferences
        </span>
      </label>
      {error && (
        <p
          id="consent-error"
          className="mt-2 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default PrivacyNotice;