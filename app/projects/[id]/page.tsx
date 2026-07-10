'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import TaskList from '@/components/TaskList'
import TaskFormModal from '@/components/TaskFormModal'
import DBErrorBanner from '@/components/DBErrorBanner'
import { Task, TaskFormData, Project, FilterType } from '@/lib/types'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const FILTERS: { label: string; value: FilterType; emoji: string }[] = [
  { label: 'All', value: 'all', emoji: '📋' },
  { label: 'Today', value: 'today', emoji: '☀️' },
  { label: 'This Week', value: 'week', emoji: '📅' },
  { label: 'Completed', value: 'completed', emoji: '✅' },
  { label: 'Overdue', value: 'overdue', emoji: '⚠️' },
]

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const projectId = params.id
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')

  const fetchData = useCallback(async () => {
    setDbError(null)
    try {
      const [projRes, taskRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/tasks?projectId=${projectId}`),
      ])
      if (projRes.status === 404) { setNotFound(true); return }
      const projData = await projRes.json()
      const taskData = await taskRes.json()
      if (!projRes.ok) { setDbError(projData.error ?? 'Failed to load project'); return }
      if (!taskRes.ok) { setDbError(taskData.error ?? 'Failed to load tasks'); return }
      setProject(projData)
      setTasks(taskData.tasks)
    } catch {
      setDbError('Network error — could not reach the server.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAddTask = async (data: TaskFormData) => {
    setAddLoading(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, projectId }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Failed to add task'); return }
      setTasks((prev) => [json, ...prev])
      setShowAddModal(false)
      toast.success('Task added! ✨')
    } catch {
      toast.error('Failed to add task')
    } finally {
      setAddLoading(false)
    }
  }

  const completed = tasks.filter((t) => t.completed).length
  const progress = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100)
  const color = project?.color ?? '#E91E8C'

  if (notFound) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto text-center py-20 animate-fade-in">
          <div className="text-4xl mb-3">🔍</div>
          <h1 className="font-playfair text-xl font-bold text-[#3D0026] dark:text-pink-50 mb-1">Project not found</h1>
          <p className="text-sm text-gray-400 dark:text-pink-300/50 mb-5">
            This project may have been deleted.
          </p>
          <Link href="/projects" className="btn-primary inline-flex items-center gap-2">← Back to Projects</Link>
        </div>
      </AppShell>
    )
  }

  return (
    <>
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
          {/* Breadcrumb */}
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-xs text-[#C2185B]/70 dark:text-pink-400/60 hover:text-[#880E4F] dark:hover:text-pink-300 transition-colors font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Projects
          </Link>

          {/* Project header */}
          <div
            className="relative bg-white dark:bg-[#3d0030] rounded-2xl border border-pink-100 dark:border-[#E91E8C]/15 p-5 card-shadow overflow-hidden"
          >
            <span className="absolute top-0 left-0 h-full w-1.5" style={{ backgroundColor: color }} />
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: `${color}1A`, color }}
                >
                  {loading ? '' : project?.icon}
                </div>
                <div className="min-w-0">
                  <h1 className="font-playfair text-2xl font-bold text-[#3D0026] dark:text-pink-50 truncate">
                    {loading ? 'Loading…' : project?.name}
                  </h1>
                  {project?.description && (
                    <p className="text-sm text-gray-400 dark:text-pink-300/50 mt-0.5 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">New Task</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>

            {/* Progress bar */}
            {!loading && tasks.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-gray-500 dark:text-pink-300/60">
                    {completed} of {tasks.length} done
                  </span>
                  <span className="font-bold" style={{ color }}>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-pink-100 dark:bg-[#E91E8C]/15 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )}
          </div>

          {dbError ? (
            <DBErrorBanner message={dbError} />
          ) : (
            <>
              {/* Filter tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0',
                      filter === f.value
                        ? 'text-white shadow-sm'
                        : 'bg-white dark:bg-[#3d0030] text-gray-500 dark:text-pink-300/60 hover:text-[#C2185B] dark:hover:text-pink-200 hover:bg-pink-50 dark:hover:bg-[#E91E8C]/10 border border-pink-100 dark:border-[#E91E8C]/15'
                    )}
                    style={filter === f.value ? { background: 'linear-gradient(135deg,#C2185B,#E91E8C)' } : undefined}
                  >
                    {f.emoji} {f.label}
                  </button>
                ))}
              </div>

              <div className="bg-white dark:bg-[#3d0030] rounded-2xl border border-pink-100 dark:border-[#E91E8C]/15 p-5 card-shadow">
                <TaskList tasks={tasks} loading={loading} filter={filter} onTasksChange={setTasks} />
              </div>
            </>
          )}
        </div>
      </AppShell>

      {showAddModal && (
        <TaskFormModal mode="add" onClose={() => setShowAddModal(false)} onSubmit={handleAddTask} loading={addLoading} />
      )}
    </>
  )
}
