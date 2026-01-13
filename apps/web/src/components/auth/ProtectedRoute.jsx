// Protected route component - redirects to sign-in if not authenticated
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const isInitialized = useSelector((state) => state.auth.isInitialized);
  const currentUser = useSelector((state) => state.auth.currentUser);
  const location = useLocation();

  // Show loading state while auth initializes
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-moss mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!currentUser) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
