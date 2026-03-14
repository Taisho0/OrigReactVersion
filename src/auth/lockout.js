const KEY = 'loginAttempts'
export const MAX_LOGIN_ATTEMPTS = 3
export const LOCKOUT_MS = 2 * 60 * 1000 // 2 minutes

export function getAttempts() {
  const data = JSON.parse(localStorage.getItem(KEY) || '{"count":0,"timestamp":0}')
  const now = Date.now()
  if (now - data.timestamp > LOCKOUT_MS) return 0
  return data.count || 0
}

export function incrementAttempts() {
  const data = JSON.parse(localStorage.getItem(KEY) || '{"count":0,"timestamp":0}')
  const now = Date.now()
  if (now - data.timestamp > LOCKOUT_MS) {
    localStorage.setItem(KEY, JSON.stringify({ count: 1, timestamp: now }))
    return
  }
  localStorage.setItem(KEY, JSON.stringify({ count: (data.count || 0) + 1, timestamp: now }))
}

export function resetAttempts() {
  localStorage.setItem(KEY, JSON.stringify({ count: 0, timestamp: 0 }))
}

export function isLockedOut() {
  return getAttempts() >= MAX_LOGIN_ATTEMPTS
}

export function getLockoutRemainingMs() {
  const data = JSON.parse(localStorage.getItem(KEY) || '{"count":0,"timestamp":0}')
  const now = Date.now()
  const remaining = LOCKOUT_MS - (now - (data.timestamp || 0))
  return Math.max(0, remaining)
}