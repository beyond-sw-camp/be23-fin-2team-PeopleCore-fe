import { useLocation } from 'react-router-dom'
import GradeDraftAuto from './grading/GradeDraftAuto'
import GradeCalibration from './grading/GradeCalibration'
import GradeFinalLock from './grading/GradeFinalLock'

export default function EvalGrading() {
  const { pathname } = useLocation()
  const sub = pathname.split('/')[3] || 'auto'

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {sub === 'auto' && <GradeDraftAuto />}
      {sub === 'calibration' && <GradeCalibration />}
      {sub === 'final' && <GradeFinalLock />}
    </div>
  )
}
