// Privacy toggle component
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useUpdatePrivacyConsentMutation } from '../../store/profileApi';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';

function PrivacyToggle({ className = '' }) {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.currentUser);
  const profile = useSelector((state) => state.profile.profile);
  
  const [updatePrivacyConsent, { isLoading }] = useUpdatePrivacyConsentMutation();
  const [error, setError] = useState(null);
  const [localValue, setLocalValue] = useState(profile?.privacyConsent ?? false);

  const handleToggle = async (e) => {
    const newValue = e.target.checked;
    const previousValue = localValue;
    
    // Optimistic update
    setLocalValue(newValue);
    
    if (!currentUser) {
      setLocalValue(previousValue);
      setError('Not authenticated');
      return;
    }

    try {
      await updatePrivacyConsent({
        userId: currentUser.uid,
        privacyConsent: newValue,
      }).unwrap();
      setError(null);
    } catch (err) {
      // Rollback on error
      setLocalValue(previousValue);
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);
    }
  };

  return (
    <div className={className}>
      <label className="flex items-center justify-between cursor-pointer group">
        <div className="flex-1">
          <span className="block text-sm font-medium text-charcoal mb-1">
            Privacy Consent
          </span>
          <span className="block text-xs text-gray-500">
            Allow data to be used for personalization
          </span>
        </div>
        <div className="relative ml-4">
          <input
            type="checkbox"
            checked={localValue}
            onChange={handleToggle}
            disabled={isLoading}
            className="sr-only"
            aria-label="Privacy consent toggle"
          />
          <div
            className={`w-14 h-8 rounded-full transition-colors duration-200 ${
              localValue ? 'bg-moss' : 'bg-gray-300'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            role="switch"
            aria-checked={localValue}
            aria-label="Privacy consent"
          >
            <div
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                localValue ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </div>
        </div>
      </label>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default PrivacyToggle;
