jest.mock('../lib/supabase', () => ({ supabase: { auth: {} } }))

import { needsRefresh } from '../lib/session'

const now = 1_700_000_000

function session(expiresIn: number | undefined) {
  return { expires_at: expiresIn === undefined ? undefined : now + expiresIn } as any
}

describe('needsRefresh', () => {
  it('needs a refresh when there is no session', () => {
    expect(needsRefresh(null, now)).toBe(true)
  })

  it('needs a refresh when the token expires within two minutes', () => {
    expect(needsRefresh(session(60), now)).toBe(true)
    expect(needsRefresh(session(120), now)).toBe(true)
  })

  it('needs a refresh when the token is already expired', () => {
    expect(needsRefresh(session(-10), now)).toBe(true)
  })

  it('does not refresh a token that is still valid for long enough', () => {
    expect(needsRefresh(session(600), now)).toBe(false)
  })

  it('keeps a session without an expiry', () => {
    expect(needsRefresh(session(undefined), now)).toBe(false)
  })
})
