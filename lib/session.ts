import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { withTimeout } from './withTimeout'

const EXPIRY_MARGIN_SECONDS = 120

let inFlight: Promise<Session | null> | null = null
let lastError = ''

export function needsRefresh(session: Session | null, nowSeconds: number): boolean {
  if (!session) return true
  if (!session.expires_at) return false
  return session.expires_at - nowSeconds <= EXPIRY_MARGIN_SECONDS
}

export function lastSessionError(): string {
  return lastError
}

async function refreshOnce(): Promise<Session | null> {
  try {
    const { data, error } = await withTimeout(supabase.auth.refreshSession(), 20000)
    if (error) lastError = error.message
    return data?.session ?? null
  } catch (e: any) {
    lastError = e?.message ?? 'timeout'
    return null
  }
}

export async function ensureFreshSession(): Promise<Session | null> {
  const current = (await withTimeout(supabase.auth.getSession(), 10000).catch(() => null))?.data?.session ?? null
  if (!needsRefresh(current, Math.floor(Date.now() / 1000))) return current

  // Vain yksi uusinta kerrallaan: rinnakkainen uusinta polttaa refresh tokenin.
  if (!inFlight) {
    inFlight = refreshOnce().finally(() => { inFlight = null })
  }
  const refreshed = await inFlight
  if (refreshed) { lastError = ''; return refreshed }

  const after = (await withTimeout(supabase.auth.getSession(), 10000).catch(() => null))?.data?.session ?? null
  return after ?? current
}
