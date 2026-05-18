// ── Project / Editing types ───────────────────────────────────────────────

export type ProjectStatus =
  | 'draft'
  | 'in_review'
  | 'revision'
  | 'approved'
  | 'done'

export interface Revision {
  id: string
  round: number
  feedback: string
  authorId: string
  createdAt: string
}

export interface Project {
  id: string
  title: string
  description?: string
  status: ProjectStatus
  clientId: string
  assignedTo?: string
  deadline?: string
  fileUrls: string[]
  revisions: Revision[]
  createdAt: string
  updatedAt: string
}

export interface ProjectFormValues {
  title: string
  description?: string
  clientId: string
  deadline?: string
}
