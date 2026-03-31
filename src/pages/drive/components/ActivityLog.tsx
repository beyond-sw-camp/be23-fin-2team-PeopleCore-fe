import type { ActivityItem } from '../types'
import { formatDate } from '../types'

interface ActivityLogProps {
  activities: ActivityItem[]
}

const ACTION_CONFIG: Record<ActivityItem['action'], { icon: string; label: string; color: string }> = {
  create_folder: { icon: 'fa-solid fa-folder-plus', label: '폴더 생성', color: 'text-blue-500' },
  delete_folder: { icon: 'fa-solid fa-folder-minus', label: '폴더 삭제', color: 'text-red-400' },
  upload: { icon: 'fa-solid fa-cloud-arrow-up', label: '파일 업로드', color: 'text-[var(--primary-color)]' },
  delete: { icon: 'fa-solid fa-trash', label: '파일 삭제', color: 'text-red-400' },
  rename: { icon: 'fa-solid fa-pen', label: '이름 변경', color: 'text-amber-500' },
  download: { icon: 'fa-solid fa-cloud-arrow-down', label: '파일 다운로드', color: 'text-indigo-500' },
  restore: { icon: 'fa-solid fa-rotate-left', label: '파일 복원', color: 'text-green-500' },
  permanent_delete: { icon: 'fa-solid fa-trash-can', label: '영구 삭제', color: 'text-red-600' },
}

export default function ActivityLog({ activities }: ActivityLogProps) {
  return (
    <div className="w-[260px] bg-white border-l border-gray-200 flex flex-col shrink-0 h-full">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-[14px] font-bold text-gray-800">활동 이력</h3>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activities.length === 0 ? (
          <div className="text-center text-[12px] text-gray-400 py-8">
            활동 이력이 없습니다.
          </div>
        ) : (
          <div className="space-y-0">
            {activities.map((activity) => {
              const config = ACTION_CONFIG[activity.action]
              return (
                <div key={activity.id} className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className={`w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5 ${config.color}`}>
                    <i className={`${config.icon} text-[11px]`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-gray-800">{config.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      {activity.location}에 '{activity.targetName}'
                      {activity.action === 'create_folder' && ' 폴더를 생성했습니다.'}
                      {activity.action === 'delete_folder' && ' 폴더를 삭제했습니다.'}
                      {activity.action === 'upload' && '을 업로드했습니다.'}
                      {activity.action === 'delete' && '을 삭제했습니다.'}
                      {activity.action === 'rename' && '의 이름을 변경했습니다.'}
                      {activity.action === 'download' && '을 다운로드했습니다.'}
                      {activity.action === 'restore' && '을 복원했습니다.'}
                      {activity.action === 'permanent_delete' && '을 영구 삭제했습니다.'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatDate(activity.timestamp)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
