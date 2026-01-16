// Sign Up Page
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  EnvelopeIcon,
  LockKeyIcon,
  ArrowRightIcon,
  MapTrifoldIcon,
  MountainsIcon,
} from "@phosphor-icons/react";
import { signUpWithEmail } from "../store/authSlice";
import SocialAuthButton from "../components/auth/SocialAuthButton";
import ErrorAlert from "../components/auth/ErrorAlert";

function SignUpPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isLoading = useSelector((state) => state.auth.isLoading);
  const error = useSelector((state) => state.auth.error);
  const user = useSelector((state) => state.auth.currentUser);
  const currentUser = useSelector((state) => state.auth.currentUser);
  
  useEffect(() => {
    if (user) {
      navigate("/onboarding");
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    terms: false,
  });
  const [formError, setFormError] = useState(null);
  const [localError, setLocalError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear errors when user types
    if (formError) setFormError(null);
    if (localError) setLocalError(null);
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setFormError("First name is required");
      return false;
    }
    if (!formData.lastName.trim()) {
      setFormError("Last name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setFormError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormError("Please enter a valid email address");
      return false;
    }
    if (!formData.password) {
      setFormError("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return false;
    }
    if (!formData.terms) {
      setFormError("You must agree to the Terms of Service and Privacy Policy");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setLocalError(null);

    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(
        signUpWithEmail({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        })
      ).unwrap();
      // Redirect to profile or dashboard
      navigate("/onboarding");
    } catch (err) {
      setLocalError(err);
    }
  };

  const displayError = formError || localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-0 bg-sand">
      <div className="w-full max-w-[1920px] bg-white lg:min-h-screen grid lg:grid-cols-12 shadow-2xl overflow-hidden">
        {/* LEFT: Visual Storytelling (Hidden on mobile) */}
        <div className="lg:col-span-5 relative hidden lg:block overflow-hidden bg-moss">
          <img
            src="https://images.unsplash.com/photo-1532339142463-fd0a8979791a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80"
            alt="Scenic mountain road"
            className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay animate-fade-in"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-moss/60 via-moss/40 to-moss/90"></div>

          <div className="absolute inset-0 flex flex-col justify-between p-12 z-10">
            <Link
              to="/"
              className="flex items-center gap-2 text-white w-fit opacity-90 hover:opacity-100 transition-opacity"
            >
              <MapTrifoldIcon weight="fill" className="text-2xl" />
              <span className="font-display font-semibold text-xl tracking-tight">
                RoadDoggs
              </span>
            </Link>

            <div className="space-y-6">
              <div
                className="glass-panel p-6 rounded-2xl border-l-4 border-l-ochre animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="flex gap-1 text-ochre mb-3 text-sm">
                  {"★".repeat(5)}
                </div>
                <p className="font-display text-2xl text-white leading-snug mb-4">
                  "I used to dread the planning. Now the planning feels like
                  part of the vacation."
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                    alt="User avatar"
                    className="w-10 h-10 rounded-full border-2 border-white/20"
                  />
                  <div>
                    <p className="text-white text-sm font-medium">Elena R.</p>
                    <p className="text-white/60 text-xs">
                      Airstream Enthusiast
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="flex gap-3 text-white/80 text-xs font-medium tracking-wide uppercase animate-fade-in-up"
                style={{ animationDelay: "0.3s" }}
              >
                <span className="flex items-center gap-1">✓ Offline Maps</span>
                <span className="flex items-center gap-1">✓ Collab Mode</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Registration Form */}
        <div className="lg:col-span-7 bg-sand flex flex-col justify-center px-6 py-12 lg:p-24 relative">
          {/* Mobile Header */}
          <div className="lg:hidden mb-8 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-moss">
              <MountainsIcon   weight="fill" className="text-2xl" />
              <span className="font-display font-semibold text-xl">
                RoadDoggs
              </span>
            </Link>
          </div>

          {/* Back Link */}
          <Link
            to="/"
            className="absolute top-8 right-8 lg:top-12 lg:right-12 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-moss transition-colors"
          >
            Back to Home <ArrowRightIcon size={16} />
          </Link>

          <div className="w-full max-w-md mx-auto animate-fade-in-up">
            {/* Header */}
            <div className="mb-10">
              <span className="text-ochre font-bold tracking-widest text-xs uppercase mb-2 block">
                Start Your Engine
              </span>
              <h1 className="font-display text-4xl lg:text-5xl font-semibold text-charcoal mb-3">
                Create an account
              </h1>
              <p className="text-gray-600">
                Join the community of modern road trippers.
                <br className="hidden md:block" />
                It takes less than a minute.
              </p>
            </div>

            {/* Error Alert */}
            {displayError && (
              <ErrorAlert
                error={displayError}
                onDismiss={() => {
                  setFormError(null);
                  setLocalError(null);
                }}
              />
            )}

            {/* Google Auth */}
            <SocialAuthButton
              provider="google"
              label="Sign up with Google"
              onError={setLocalError}
              className="mb-6"
            />

            {/* Separator */}
            <div className="relative flex py-2 items-center mb-6">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-wider font-semibold">
                Or with email
              </span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div className="relative">
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder=" "
                    className="floating-input peer block px-4 py-3.5 w-full text-charcoal bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-moss focus:border-moss transition-colors"
                    required
                    aria-label="First name"
                    aria-invalid={
                      formError && !formData.firstName ? "true" : "false"
                    }
                    aria-describedby={
                      formError && !formData.firstName
                        ? "firstName-error"
                        : undefined
                    }
                  />
                  <label
                    htmlFor="firstName"
                    className="absolute text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 cursor-text"
                  >
                    First Name
                  </label>
                </div>

                {/* Last Name */}
                <div className="relative">
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder=" "
                    className="floating-input peer block px-4 py-3.5 w-full text-charcoal bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-moss focus:border-moss transition-colors"
                    required
                    aria-label="Last name"
                  />
                  <label
                    htmlFor="lastName"
                    className="absolute text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 cursor-text"
                  >
                    Last Name
                  </label>
                </div>
              </div>

              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder=" "
                  className="floating-input peer block px-4 py-3.5 w-full text-charcoal bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-moss focus:border-moss transition-colors pr-12"
                  required
                  aria-label="Email address"
                  aria-invalid={
                    formError &&
                    (!formData.email ||
                      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
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

              {/* Password */}
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder=" "
                  className="floating-input peer block px-4 py-3.5 w-full text-charcoal bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-moss focus:border-moss transition-colors pr-12"
                  required
                  aria-label="Password"
                  aria-invalid={
                    formError &&
                    (!formData.password || formData.password.length < 6)
                      ? "true"
                      : "false"
                  }
                />
                <label
                  htmlFor="password"
                  className="absolute text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 cursor-text"
                >
                  Password
                </label>
                <LockKeyIcon
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                  weight="regular"
                />
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 pt-2">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={formData.terms}
                    onChange={handleChange}
                    className="w-5 h-5 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-moss/20 accent-moss"
                    required
                    aria-label="Agree to Terms of Service and Privacy Policy"
                  />
                </div>
                <label
                  htmlFor="terms"
                  className="text-sm font-medium text-gray-500 leading-snug"
                >
                  I agree to the{" "}
                  <a href="#" className="text-moss hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-moss hover:underline">
                    Privacy Policy
                  </a>
                  . No spam, just maps.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-moss text-white font-semibold py-4 rounded-full shadow-xl shadow-moss/20 hover:shadow-moss/30 hover:scale-[1.01] hover:bg-moss-light transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating account..." : "Let's Go"}
                <ArrowRightIcon
                  size={20}
                  weight="bold"
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="text-moss font-semibold hover:text-ochre transition-colors"
                >
                  Log in here
                </Link>
              </p>
            </div>
          </div>

          {/* Decorative Bottom Element */}
          <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none">
            <MapTrifoldIcon
              weight="fill"
              className="text-[20rem] text-moss transform translate-x-12 translate-y-12"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
