export type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

export type FilterType = 'all' | 'today' | 'week' | 'completed' | 'overdue'

export interface Task {
  id: string
  userId: string
  projectId: string | null
  title: string
  description: string | null
  dueDate: string | null
  priority: Priority
  completed: boolean
  order: number
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface TaskFormData {
  title: string
  description?: string
  dueDate?: string
  priority: Priority
  imageUrl?: string | null
  projectId?: string | null
}

export interface Project {
  id: string
  userId: string
  name: string
  description: string | null
  color: string
  icon: string
  order: number
  createdAt: string
  updatedAt: string
  taskCount: number
  completedCount: number
  progress: number
}

export interface ProjectFormData {
  name: string
  description?: string | null
  color: string
  icon: string
}

export interface StatsData {
  total: number
  completedToday: number
  pending: number
  overdue: number
}
