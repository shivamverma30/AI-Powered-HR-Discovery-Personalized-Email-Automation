import { prisma } from '../lib/prisma.js'
import { config } from '../config.js'

// Daily email sending limit, enforced on the backend using the database.
// Timezone policy: a "day" is a UTC calendar day. The reset time is the next
// UTC midnight. This is documented and consistent across restarts/instances.

export function getDailyLimit() {
  return config.dailyEmailLimit
}

// Start of the current UTC day.
function startOfUtcDay(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

// Next UTC midnight (when the count resets).
function nextUtcMidnight(now = new Date()) {
  const start = startOfUtcDay(now)
  return new Date(start.getTime() + 24 * 60 * 60 * 1000)
}

// Count emails successfully sent by the user today (UTC).
export async function countSentToday(userId) {
  const since = startOfUtcDay()
  return prisma.emailDraft.count({
    where: { userId, status: 'sent', sentAt: { gte: since } },
  })
}

// Return usage details for the authenticated user.
export async function getUsage(userId) {
  const limit = getDailyLimit()
  const used = await countSentToday(userId)
  const remaining = Math.max(0, limit - used)
  return {
    limit,
    sentToday: used,
    remaining,
    resetsAt: nextUtcMidnight().toISOString(),
  }
}

// True if the user still has quota remaining today.
export async function hasQuota(userId) {
  const { remaining } = await getUsage(userId)
  return remaining > 0
}
