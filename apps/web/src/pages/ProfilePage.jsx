// Profile Page
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { MapTrifoldIcon, UserIcon, SlidersHorizontalIcon, ShieldCheckIcon } from '@phosphor-icons/react';
import { useGetProfileQuery, useUpdateProfileMutation } from '../store/profileApi';
import PhotoUpload from '../components/profile/PhotoUpload';
import PrivacyToggle from '../components/profile/PrivacyToggle';
import ProviderManagement from '../components/profile/ProviderManagement';

function ProfilePage() {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.currentUser);
  const { data: profile, isLoading: profileLoading } = useGetProfileQuery(currentUser?.uid, {
    skip: !currentUser?.uid,
  });
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [activeSection, setActiveSection] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    systemUnits: 'imperial',
    timeFormat: '12h',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || currentUser?.displayName || '',
        email: profile.email || currentUser?.email || '',
        systemUnits: profile.systemUnits || 'imperial',
        timeFormat: profile.timeFormat || '12h',
      });
    }
  }, [profile, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentUser) {
      setError('Not authenticated');
      return;
    }

    try {
      await updateProfile({
        userId: currentUser.uid,
        updates: {
          name: formData.name,
          systemUnits: formData.systemUnits,
          timeFormat: formData.timeFormat,
          // TODO: Email update requires encryption API - gate this field until available
        },
      }).unwrap();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-moss mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <MapTrifoldIcon weight="fill" className="text-2xl text-moss" />
            <span className="font-display font-semibold text-xl tracking-tight text-charcoal">RoadDoggs</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-gray-500 hover:text-moss transition-colors">
              Dashboard
            </Link>
            {currentUser?.photoURL && (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="w-8 h-8 rounded-full ring-2 ring-white ring-offset-2 ring-offset-sand"
              />
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 md:py-12">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT NAV: Settings Index */}
          <aside className="lg:col-span-3 lg:sticky lg:top-28">
            <h1 className="font-display text-3xl font-bold text-charcoal mb-6">Settings</h1>

            <nav className="flex flex-col gap-1">
              <button
                onClick={() => setActiveSection('profile')}
                className={`nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-all ${
                  activeSection === 'profile' ? 'bg-sand-dark text-moss font-semibold' : ''
                }`}
              >
                <UserIcon weight={activeSection === 'profile' ? 'fill' : 'regular'} size={20} className={activeSection === 'profile' ? 'text-ochre' : 'text-gray-400'} />
                <span className="text-sm">Profile</span>
              </button>

              <button
                onClick={() => setActiveSection('preferences')}
                className={`nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-all ${
                  activeSection === 'preferences' ? 'bg-sand-dark text-moss font-semibold' : ''
                }`}
              >
                <SlidersHorizontalIcon weight={activeSection === 'preferences' ? 'fill' : 'regular'} size={20} className={activeSection === 'preferences' ? 'text-ochre' : 'text-gray-400'} />
                <span className="text-sm">Travel Preferences</span>
              </button>

              <div className="my-2 border-t border-gray-200 mx-4"></div>

              <button
                onClick={() => setActiveSection('account')}
                className={`nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-all ${
                  activeSection === 'account' ? 'bg-sand-dark text-moss font-semibold' : ''
                }`}
              >
                <ShieldCheckIcon       weight={activeSection === 'account' ? 'fill' : 'regular'} size={20} className={activeSection === 'account' ? 'text-ochre' : 'text-gray-400'} />
                <span className="text-sm">Account Security</span>
              </button>
            </nav>
          </aside>

          {/* RIGHT PANEL: Active Settings */}
          <div className="lg:col-span-9 space-y-8">
            {/* PROFILE SECTION */}
            {activeSection === 'profile' && (
              <section className="bg-white rounded-3xl p-8 shadow-soft border border-gray-100">
                <h2 className="font-display text-xl font-semibold text-charcoal mb-1">Public Profile</h2>
                <p className="text-sm text-gray-500 mb-8">How you appear to collaborators.</p>

                <form onSubmit={handleSubmit}>
                  <div className="flex items-start gap-8 border-b border-gray-100 pb-8 mb-8">
                    <PhotoUpload />
                    <div className="flex-1 space-y-4 max-w-md">
                      <div>
                        <label htmlFor="name" className="block text-xs font-bold text-gray-500 uppercase mb-1">
                          Display Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-charcoal focus:outline-none focus:border-moss transition-colors"
                          aria-label="Display name"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase mb-1">
                          Email
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            disabled
                            className="w-full bg-gray-100 border border-transparent rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed"
                            aria-label="Email (cannot be changed here)"
                          />
                          <button
                            type="button"
                            className="text-xs font-medium text-moss hover:underline whitespace-nowrap"
                            disabled
                            title="Email change requires backend encryption API"
                          >
                            Change
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Email changes require backend encryption</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-3">System Units</label>
                      <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200 w-fit">
                        <button
                          type="button"
                          onClick={() => handleChange({ target: { name: 'systemUnits', value: 'imperial' } })}
                          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            formData.systemUnits === 'imperial'
                              ? 'bg-white shadow-sm text-moss'
                              : 'text-gray-500 hover:text-charcoal'
                          }`}
                        >
                          Imperial (mi)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange({ target: { name: 'systemUnits', value: 'metric' } })}
                          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            formData.systemUnits === 'metric'
                              ? 'bg-white shadow-sm text-moss'
                              : 'text-gray-500 hover:text-charcoal'
                          }`}
                        >
                          Metric (km)
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Time Format</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="timeFormat"
                            value="12h"
                            checked={formData.timeFormat === '12h'}
                            onChange={handleChange}
                            className="accent-moss w-4 h-4"
                          />
                          <span className="text-sm text-gray-700">12h (1:00 PM)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="timeFormat"
                            value="24h"
                            checked={formData.timeFormat === '24h'}
                            onChange={handleChange}
                            className="accent-moss w-4 h-4"
                          />
                          <span className="text-sm text-gray-700">24h (13:00)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Toggle */}
                  <div className="mb-8">
                    <PrivacyToggle />
                  </div>

                  {/* Success/Error Messages */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}
                  {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">Profile updated successfully!</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="bg-moss text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-moss-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </section>
            )}

            {/* PREFERENCES SECTION */}
            {activeSection === 'preferences' && (
              <section className="bg-white rounded-3xl p-8 shadow-soft border border-gray-100">
                <h2 className="font-display text-xl font-semibold text-charcoal mb-1">Travel Preferences</h2>
                <p className="text-sm text-gray-500 mb-8">
                  {profile?.travelPreferences
                    ? 'Your travel preferences are set. Full editing UI coming soon.'
                    : 'No travel preferences set yet. Complete onboarding to set preferences.'}
                </p>
                {profile?.travelPreferences && (
                  <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto">
                    {JSON.stringify(profile.travelPreferences, null, 2)}
                  </pre>
                )}
              </section>
            )}

            {/* ACCOUNT SECURITY SECTION */}
            {activeSection === 'account' && (
              <section className="bg-white rounded-3xl p-8 shadow-soft border border-gray-100">
                <h2 className="font-display text-xl font-semibold text-charcoal mb-1">Account Security</h2>
                <p className="text-sm text-gray-500 mb-8">Manage your connected accounts and authentication methods.</p>
                <ProviderManagement />
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
