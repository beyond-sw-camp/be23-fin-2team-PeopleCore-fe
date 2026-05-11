<template>
  <div class="dashboard-widget">
    <div class="widget-header">
      <span class="widget-icon">{{ icon }}</span>
      <h3 class="widget-title">{{ title }}</h3>
    </div>
    <div class="widget-value">{{ value }}</div>
    <div class="widget-sub">{{ sub }}</div>
    <div
      class="widget-badge"
      :class="trend === 'up' ? 'badge-up' : trend === 'down' ? 'badge-down' : 'badge-neutral'"
    >
      {{ trendLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
}>()
</script>

<style scoped>
.dashboard-widget {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 180px;
}
.widget-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.widget-icon {
  font-size: 1.4rem;
}
.widget-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  margin: 0;
}
.widget-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}
.widget-sub {
  font-size: 0.75rem;
  color: #94a3b8;
}
.widget-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 0.7rem;
  font-weight: 600;
  width: fit-content;
}
.badge-up   { background: #dcfce7; color: #16a34a; }
.badge-down { background: #fee2e2; color: #dc2626; }
.badge-neutral { background: #f1f5f9; color: #64748b; }
</style>
