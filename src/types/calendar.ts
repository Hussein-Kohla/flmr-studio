// ── Calendar / Event types ────────────────────────────────────────────────

export type EventType = 'booking' | 'deadline' | 'meeting' | 'other'

export interface CalendarEvent {
  id: string
  title: string
  type: EventType
  startAt: string
  endAt?: string
  allDay?: boolean
  clientId?: string
  projectId?: string
  notes?: string
  createdAt: string
}

export interface CalendarEventFormValues {
  title: string
  type: EventType
  startAt: string
  endAt?: string
  allDay?: boolean
  clientId?: string
  projectId?: string
  notes?: string
}
