// Firebase error code to user-friendly message mapping
export const getFirebaseErrorMessage = (errorCode) => {
  const errorMessages = {
    // Authentication errors
    "auth/email-already-in-use":
      "This email is already registered. Sign in instead.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/operation-not-allowed": "This sign-in method is not enabled.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/invalid-verification-code": "Invalid verification code.",
    "auth/invalid-verification-id": "Invalid verification ID.",
    "auth/code-expired": "Verification code has expired.",
    "auth/too-many-requests":
      "Too many failed attempts. Please try again later.",
    "auth/network-request-failed":
      "Network error. Please check your connection.",
    "auth/popup-closed-by-user": "Sign-in popup was closed.",
    "auth/cancelled-popup-request":
      "Only one popup request is allowed at a time.",
    "auth/popup-blocked": "Pop-up blocked. Please allow pop-ups and try again.",
    "auth/account-exists-with-different-credential":
      "An account already exists with this email using a different sign-in method.",
    "auth/credential-already-in-use":
      "This credential is already associated with a different account.",
    "auth/provider-already-linked": "This account is already linked.",
    "auth/requires-recent-login": "Please sign in again to link this account.",
    "auth/no-auth-event": "No authentication event available.",
    "auth/missing-or-invalid-nonce": "Missing or invalid nonce.",
    "auth/expired-action-code": "This action code has expired.",
    "auth/invalid-action-code": "This action code is invalid.",

    // Provider linking errors
    "auth/auth-domain-config-required": "Auth domain configuration required.",
    "auth/operation-not-supported-in-this-environment":
      "This operation is not supported in this environment.",

    // General errors
    "auth/internal-error": "An internal error occurred. Please try again.",
    "permission-denied": "You do not have permission to perform this action.",
    unavailable: "Service is temporarily unavailable. Please try again later.",
  };

  return errorMessages[errorCode] || "An error occurred. Please try again.";
};
