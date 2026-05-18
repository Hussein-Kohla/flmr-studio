// ── Settings types ────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light' | 'system'
export type Language = 'en' | 'ar'

export interface UserProfile {
  displayName: string
  email: string
  avatarUrl?: string
}

export interface AppPreferences {
  theme: Theme
  language: Language
  notificationsEnabled: boolean
}

export interface BusinessSettings {
  studioName: string
  logoUrl?: string
  contactEmail?: string
  contactPhone?: string
  website?: string
}

export interface Settings {
  userId: string
  profile: UserProfile
  preferences: AppPreferences
  business: BusinessSettings
  updatedAt: string
}
