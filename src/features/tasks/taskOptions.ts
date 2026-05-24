/** Task priorities — keep in sync with TasksPage filter and badges */
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export function isTaskPriority(value: string): value is TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(value)
}
