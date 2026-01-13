// Progress bar component for onboarding step indicator
function ProgressBar({ currentStep, totalSteps }) {
  // Steps 1 and 7 (welcome/completion) don't show progress bar
  const showProgress = currentStep > 1 && currentStep < totalSteps;
  
  // Calculate progress percentage (steps 2-6)
  const progressSteps = totalSteps - 2; // Steps between welcome and completion
  const currentProgressStep = currentStep - 1; // Subtract welcome step
  const percentage = showProgress
    ? ((currentProgressStep - 1) / (progressSteps - 1)) * 100
    : 0;

  if (!showProgress) {
    return null;
  }

  return (
    <div className="hidden md:flex flex-1 mx-12 items-center gap-2">
      <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-moss transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={currentProgressStep}
          aria-valuemin={1}
          aria-valuemax={progressSteps}
          aria-label={`Step ${currentProgressStep} of ${progressSteps}`}
        />
      </div>
      <span className="text-xs font-medium text-gray-500 w-16 text-right">
        Step {currentProgressStep} of {progressSteps}
      </span>
    </div>
  );
}

export default ProgressBar;