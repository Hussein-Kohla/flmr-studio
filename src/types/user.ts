// ── User & Auth types ─────────────────────────────────────────────────────

export type UserRole = 'admin' | 'editor' | 'viewer'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: UserRole
  createdAt: string
}

export interface Session {
  userId: string
  token: string
  expiresAt: string
}
