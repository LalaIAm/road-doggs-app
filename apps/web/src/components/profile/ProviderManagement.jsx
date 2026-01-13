// Provider management component for linking/unlinking social providers
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { linkProvider, unlinkProvider } from '../../store/authSlice';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';

const providerConfig = {
  'google.com': { name: 'Google', icon: '🔵' },
  'apple.com': { name: 'Apple', icon: '⚫' },
  'facebook.com': { name: 'Facebook', icon: '🔷' },
  'password': { name: 'Email/Password', icon: '✉️' },
};

function ProviderManagement({ className = '' }) {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.currentUser);
  const providersLinked = useSelector((state) => state.auth.providersLinked);
  const isLoading = useSelector((state) => state.auth.isLoading);
  
  const [error, setError] = useState(null);
  const [linkingProvider, setLinkingProvider] = useState(null);

  const handleLink = async (providerId) => {
    setError(null);
    setLinkingProvider(providerId);

    try {
      await dispatch(linkProvider({ providerId })).unwrap();
      setLinkingProvider(null);
    } catch (err) {
      setLinkingProvider(null);
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);
    }
  };

  const handleUnlink = async (providerId) => {
    if (!confirm(`Are you sure you want to unlink ${providerConfig[providerId]?.name || providerId}?`)) {
      return;
    }

    setError(null);

    try {
      await dispatch(unlinkProvider({ providerId })).unwrap();
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);
    }
  };

  const allProviders = ['google.com', 'apple.com', 'facebook.com', 'password'];
  const unlinkedProviders = allProviders.filter((p) => !providersLinked.includes(p));

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-charcoal mb-4">Connected Accounts</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {providersLinked.map((providerId) => {
          const config = providerConfig[providerId];
          if (!config) return null;

          const canUnlink = providersLinked.length > 1; // Must keep at least one provider

          return (
            <div
              key={providerId}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{config.icon}</span>
                <div>
                  <p className="font-medium text-charcoal">{config.name}</p>
                  <p className="text-xs text-gray-500">Connected</p>
                </div>
              </div>
              <button
                onClick={() => handleUnlink(providerId)}
                disabled={!canUnlink || isLoading}
                className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {canUnlink ? 'Unlink' : 'Cannot unlink'}
              </button>
            </div>
          );
        })}

        {unlinkedProviders.length > 0 && (
          <>
            <div className="border-t border-gray-200 my-4"></div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Available Providers</h4>
            {unlinkedProviders.map((providerId) => {
              const config = providerConfig[providerId];
              if (!config) return null;

              return (
                <div
                  key={providerId}
                  className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <p className="font-medium text-charcoal">{config.name}</p>
                      <p className="text-xs text-gray-500">Not connected</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLink(providerId)}
                    disabled={isLoading || linkingProvider === providerId}
                    className="text-sm font-medium text-moss hover:text-moss-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {linkingProvider === providerId ? 'Linking...' : 'Link'}
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export default ProviderManagement;
