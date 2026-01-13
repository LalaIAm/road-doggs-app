// Password Reset Page
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  EnvelopeIcon,
  ArrowRightIcon,
  MapTrifoldIcon, 
  CheckCircleIcon,
} from "@phosphor-icons/react";
import { sendPasswordResetEmail } from "../store/authSlice";
import ErrorAlert from "../components/auth/ErrorAlert";

function PasswordResetPage() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.auth.isLoading);
  const error = useSelector((state) => state.auth.error);

  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleChange = (e) => {
    setEmail(e.target.value);
    // Clear errors when user types
    if (formError) setFormError(null);
    if (localError) setLocalError(null);
  };

  const validateForm = () => {
    if (!email.trim()) {
      setFormError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setLocalError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(sendPasswordResetEmail(email)).unwrap();
      setSuccess(true);
    } catch (err) {
      setLocalError(err);
    }
  };

  const displayError = formError || localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-0 bg-sand">
      <div className="w-full max-w-md mx-auto">
        {/* Mobile Header */}
        <div className="mb-8 lg:hidden">
          <Link to="/" className="flex items-center gap-2 text-moss">
            <MapTrifoldIcon weight="fill" className="text-2xl" />
            <span className="font-display font-semibold text-xl">
              RoadDoggs
            </span>
          </Link>
        </div>

        {/* Back Link */}
        <Link
          to="/signin"
          className="absolute top-8 left-8 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-moss transition-colors"
        >
          <ArrowRightIcon size={16} className="rotate-180" /> Back to Sign In
        </Link>

        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-100 animate-fade-in-up">
          {/* Header */}
          <div className="mb-8">
            <span className="text-ochre font-bold tracking-widest text-xs uppercase mb-2 block">
              Reset Password
            </span>
            <h1 className="font-display text-3xl lg:text-4xl font-semibold text-charcoal mb-3">
              Forgot your password?
            </h1>
            <p className="text-gray-600">
              No worries! Enter your email address and we'll send you a link to
              reset your password.
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div
              role="alert"
              aria-live="polite"
              className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <CheckCircleIcon
                  size={24}
                  weight="fill"
                  className="text-green-600 flex-shrink-0 mt-0.5"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 mb-1">
                    Password reset email sent!
                  </p>
                  <p className="text-sm text-green-700">
                    Check your inbox at <strong>{email}</strong> for
                    instructions to reset your password.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {displayError && !success && (
            <ErrorAlert
              error={displayError}
              onDismiss={() => {
                setFormError(null);
                setLocalError(null);
              }}
            />
          )}

          {/* Form */}
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  placeholder=" "
                  className="floating-input peer block px-4 py-3.5 w-full text-charcoal bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-moss focus:border-moss transition-colors pr-12"
                  required
                  aria-label="Email address"
                  aria-invalid={
                    formError &&
                    (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                      ? "true"
                      : "false"
                  }
                />
                <label
                  htmlFor="email"
                  className="absolute text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 cursor-text"
                >
                  Email Address
                </label>
                <EnvelopeIcon
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-moss text-white font-semibold py-4 rounded-full shadow-xl shadow-moss/20 hover:shadow-moss/30 hover:scale-[1.01] hover:bg-moss-light transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
                <ArrowRightIcon
                  size={20}
                  weight="bold"
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <Link
                to="/signin"
                className="w-full bg-moss text-white font-semibold py-4 rounded-full shadow-xl shadow-moss/20 hover:shadow-moss/30 hover:scale-[1.01] hover:bg-moss-light transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                Back to Sign In
                <ArrowRightIcon 
                  size={20}
                  weight="bold"
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          )}

          {/* Footer Links */}
          <div className="mt-8 text-center pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Remember your password?{" "}
              <Link
                to="/signin"
                className="text-moss font-semibold hover:text-ochre transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetPage;
