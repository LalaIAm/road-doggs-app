// Error alert component with accessibility support
import { X } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import { getFirebaseErrorMessage } from "../../utils/firebaseErrors";

function ErrorAlert({ error, onDismiss, id = "error-alert" }) {
  const alertRef = useRef(null);

  useEffect(() => {
    // Focus on error alert when it appears for screen readers
    if (error && alertRef.current) {
      alertRef.current.focus();
    }
  }, [error]);

  if (!error) return null;

  const errorMessage =
    typeof error === "string"
      ? getFirebaseErrorMessage(error) || error
      : getFirebaseErrorMessage(error.code) ||
        error.message ||
        "An error occurred";

  return (
    <div
      ref={alertRef}
      id={id}
      role="alert"
      aria-live="assertive"
      className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 relative"
      tabIndex={-1}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">{errorMessage}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="text-red-600 hover:text-red-800 transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorAlert;
