<template>
  <UDashboardPanel>
    <template #header>
      <SeniorityNavbar title="Admin Overview" />
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-6">
        <!-- Stat Cards -->
        <div v-if="stats" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <UCard>
            <div class="space-y-1">
              <p class="text-sm text-muted">Total Users</p>
              <p class="text-3xl font-bold">{{ stats.total_users }}</p>
              <p class="text-xs text-muted">{{ stats.users_by_role.admin }} admin(s)</p>
            </div>
          </UCard>
          <UCard>
            <div class="space-y-1">
              <p class="text-sm text-muted">Total Lists</p>
              <p class="text-3xl font-bold">{{ stats.total_lists }}</p>
            </div>
          </UCard>
          <UCard>
            <div class="space-y-1">
              <p class="text-sm text-muted">Total Entries</p>
              <p class="text-3xl font-bold">{{ stats.total_entries }}</p>
            </div>
          </UCard>
          <UCard>
            <div class="space-y-1">
              <p class="text-sm text-muted">Recent Signups</p>
              <p class="text-3xl font-bold">{{ stats.recent_signups.length }}</p>
            </div>
          </UCard>
        </div>

        <div v-else-if="statsPending" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <UCard v-for="n in 4" :key="n">
            <div class="h-16 animate-pulse bg-elevated rounded" />
          </UCard>
        </div>

        <!-- Activity Feed -->
        <UCard>
          <template #header>
            <h2 class="text-base font-semibold">Recent Activity</h2>
          </template>
          <div v-if="activityPending" class="space-y-3">
            <div v-for="n in 5" :key="n" class="h-10 animate-pulse bg-elevated rounded" />
          </div>
          <ul v-else-if="activity && activity.length > 0" class="divide-y divide-(--ui-border)">
            <li
              v-for="item in activity"
              :key="item.id"
              class="flex items-start gap-3 py-3"
            >
              <UIcon
                :name="item.event_type === 'user_signup' ? 'i-lucide-user-plus' : 'i-lucide-upload'"
                class="mt-0.5 text-muted shrink-0"
              />
              <div class="min-w-0 flex-1">
                <p class="text-sm">
                  <span class="font-medium">{{ item.actor_email ?? 'Unknown' }}</span>
                  &mdash;
                  <span>{{ eventLabel(item) }}</span>
                </p>
                <p class="text-xs text-muted">{{ formatRelative(item.created_at) }}</p>
              </div>
            </li>
          </ul>
          <p v-else class="text-sm text-muted py-4 text-center">No activity yet.</p>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { AdminStatsResponse, AdminActivityResponse } from '#shared/schemas/admin'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] })

const { data: stats, pending: statsPending } = await useFetch<AdminStatsResponse>('/api/admin/stats')
const { data: activity, pending: activityPending } = await useFetch<AdminActivityResponse>('/api/admin/activity')

function eventLabel(item: AdminActivityResponse[number]): string {
  if (item.event_type === 'user_signup') return 'New user signed up'
  if (item.event_type === 'list_upload') {
    const meta = item.metadata as { title?: string; airline?: string }
    const parts: string[] = ['Uploaded a list']
    if (meta.title || meta.airline) {
      const detail = [meta.title, meta.airline ? `(${meta.airline})` : ''].filter(Boolean).join(' ')
      parts.push(`: ${detail}`)
    }
    return parts.join('')
  }
  return item.event_type
}

function formatRelative(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
</script>
