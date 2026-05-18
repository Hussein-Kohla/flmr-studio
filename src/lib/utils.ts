import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely, resolving conflicts */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Format a number as currency (EGP by default). Expects amount in CENTS. */
export function formatCurrency(
  amountCents: number,
): string {
  const amount = Math.abs(amountCents / 100);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' جنيه'
}

/** Format a Date or timestamp to a readable string */
export function formatDate(
  date: Date | string | number | undefined | null,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', options).format(d)
}

/** Truncate a string to a max length with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/** Get initials from a full name (e.g. "John Doe" → "JD") */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Sleep for n milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Calculate project progress based on steps or status */
export function calculateProjectProgress(project: any): number {
  if (!project) return 0
  if (project.status === 'done') return 100
  const steps = project.steps || []
  if (steps.length > 0) {
    const completed = steps.filter((s: any) => s.isCompleted).length
    return Math.round((completed / steps.length) * 100)
  }
  return 0
}
