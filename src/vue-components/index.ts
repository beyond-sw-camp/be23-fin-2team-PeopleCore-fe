import type { ComponentType } from 'react'
import { applyVueInReact } from 'veaury'
import DashboardWidgetVue from './DashboardWidget.vue'

interface DashboardWidgetProps {
  icon: string
  title: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
}

export const DashboardWidget = applyVueInReact(DashboardWidgetVue) as ComponentType<DashboardWidgetProps>
