// Profile photo upload component
import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useUploadProfilePhotoMutation } from '../../store/profileApi';
import { PencilSimple } from '@phosphor-icons/react';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';

function PhotoUpload({ className = '' }) {
  const currentUser = useSelector((state) => state.auth.currentUser);
  const profile = useSelector((state) => state.profile.profile);
  const [uploadPhoto, { isLoading }] = useUploadProfilePhotoMutation();
  
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    handleUpload(file);
  };

  const handleUpload = async (file) => {
    if (!currentUser) {
      setError('Not authenticated');
      return;
    }

    try {
      setUploadProgress(0);
      await uploadPhoto({
        userId: currentUser.uid,
        file,
      }).unwrap();
      setPreview(null); // Clear preview after successful upload
      setUploadProgress(100);
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);
      setPreview(null);
    }
  };

  const photoUrl = preview || profile?.profilePhotoUrl || currentUser?.photoURL;
  const displayUrl = photoUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser?.displayName || currentUser?.email || 'User');

  return (
    <div className={className}>
      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <img
          src={displayUrl}
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover ring-4 ring-gray-50 group-hover:scale-105 transition-transform"
        />
        <div className="absolute bottom-0 right-0 bg-white border border-gray-200 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 shadow-sm group-hover:bg-moss group-hover:text-white group-hover:border-moss transition-colors">
          <PencilSimple size={16} weight="bold" />
        </div>
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-medium">{uploadProgress}%</span>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload profile photo"
      />
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {isLoading && (
        <p className="mt-2 text-sm text-gray-500">Uploading...</p>
      )}
    </div>
  );
}

export default PhotoUpload;
