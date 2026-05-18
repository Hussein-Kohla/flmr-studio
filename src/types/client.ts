// ── Client types ──────────────────────────────────────────────────────────

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  avatarUrl?: string
  notes?: string
  projectIds: string[]
  createdAt: string
  updatedAt: string
}

export interface ClientFormValues {
  name: string
  email?: string
  phone?: string
  company?: string
  notes?: string
}
