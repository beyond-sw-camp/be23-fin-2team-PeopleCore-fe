interface StepIndicatorProps {
  totalSteps: number
  currentStep: number
}

export default function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 my-5">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1
        const isActive = step <= currentStep
        return (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                isActive
                  ? 'bg-[var(--primary-color)] border-[var(--primary-color)] text-white'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}
            >
              {step}
            </div>
            {step < totalSteps && (
              <div
                className={`w-8 h-0.5 ${
                  step < currentStep ? 'bg-[var(--primary-color)]' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
