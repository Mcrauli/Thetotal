import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { withTimeout } from './withTimeout'

const EXPIRY_MARGIN_SECONDS = 120

export function needsRefresh(session: Session | null, nowSeconds: number): boolean {
  if (!session) return true
  if (!session.expires_at) return false
  return session.expires_at - nowSeconds <= EXPIRY_MARGIN_SECONDS
}

export async function ensureFreshSession(attempts = 3): Promise<Session | null> {
  const current = (await withTimeout(supabase.auth.getSession(), 8000).catch(() => null))?.data?.session ?? null
  if (!needsRefresh(current, Math.floor(Date.now() / 1000))) return current

  for (let i = 0; i < attempts; i++) {
    const refreshed = (await withTimeout(supabase.auth.refreshSession(), 8000).catch(() => null))?.data?.session ?? null
    if (refreshed) return refreshed
    if (i < attempts - 1) await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
  }
  return current
}
