'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import toast from 'react-hot-toast'
import { Task, TaskFormData, FilterType, Project } from '@/lib/types'
import { isOverdue, isTodayDate, isThisWeekDate } from '@/lib/utils'
import TaskCard, { TaskCardSkeleton } from './TaskCard'
import TaskFormModal from './TaskFormModal'
import DeleteConfirmModal from './DeleteConfirmModal'

interface TaskListProps {
  tasks: Task[]
  loading?: boolean
  filter?: FilterType
  searchQuery?: string
  onTasksChange: (tasks: Task[]) => void
  projects?: Project[]
}

export default function TaskList({
  tasks,
  loading,
  filter = 'all',
  searchQuery = '',
  onTasksChange,
  projects,
}: TaskListProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !searchQuery ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    switch (filter) {
      case 'today':
        return isTodayDate(task.dueDate) && !task.completed
      case 'week':
        return isThisWeekDate(task.dueDate) && !task.completed
      case 'completed':
        return task.completed
      case 'overdue':
        return isOverdue(task.dueDate) && !task.completed
      default:
        return true
    }
  })

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = tasks.findIndex((t) => t.id === active.id)
      const newIndex = tasks.findIndex((t) => t.id === over.id)
      const reordered = arrayMove(tasks, oldIndex, newIndex)
      onTasksChange(reordered)

      try {
        await fetch('/api/tasks/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: reordered.map((t) => t.id) }),
        })
      } catch {
        toast.error('Failed to save order')
      }
    },
    [tasks, onTasksChange]
  )

  const handleToggle = async (id: string, completed: boolean) => {
    onTasksChange(tasks.map((t) => (t.id === id ? { ...t, completed } : t)))
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      })
      if (!res.ok) throw new Error()
      toast.success(completed ? '✅ Task completed!' : 'Task reopened')
    } catch {
      onTasksChange(tasks)
      toast.error('Failed to update task')
    }
  }

  const handleEdit = async (data: TaskFormData) => {
    if (!editingTask) return
    setSaving(true)
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      const updated: Task = await res.json()
      onTasksChange(tasks.map((t) => (t.id === updated.id ? updated : t)))
      setEditingTask(null)
      toast.success('Task updated!')
    } catch {
      toast.error('Failed to update task')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingTask) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/tasks/${deletingTask.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      onTasksChange(tasks.filter((t) => t.id !== deletingTask.id))
      setDeletingTask(null)
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    } finally {
      setDeleting(false)
    }
  }

  const handleRemoveImage = async (id: string) => {
    onTasksChange(tasks.map((t) => (t.id === id ? { ...t, imageUrl: null } : t)))
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: null }),
      })
      toast.success('Image removed')
    } catch {
      toast.error('Failed to remove image')
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <TaskCardSkeleton key={i} />)}
      </div>
    )
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-14 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-pink-50 dark:bg-[#E91E8C]/15 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">
            {filter === 'completed' ? '🎉' : filter === 'overdue' ? '✨' : '📝'}
          </span>
        </div>
        <p className="font-playfair text-base font-semibold text-[#3D0026] dark:text-pink-50 mb-1">
          {searchQuery
            ? 'No tasks match your search'
            : filter === 'completed' ? 'No completed tasks yet'
            : filter === 'overdue' ? 'No overdue tasks — great job!'
            : filter === 'today' ? 'No tasks due today'
            : filter === 'week' ? 'No tasks this week'
            : 'No tasks yet'}
        </p>
        <p className="text-sm text-gray-400 dark:text-pink-300/50">
          {!searchQuery && filter === 'all' && 'Add your first task to get started ✨'}
        </p>
      </div>
    )
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={filteredTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onEdit={setEditingTask}
                onDelete={setDeletingTask}
                onRemoveImage={handleRemoveImage}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {editingTask && (
        <TaskFormModal
          mode="edit"
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={handleEdit}
          loading={saving}
          projects={projects}
        />
      )}
      {deletingTask && (
        <DeleteConfirmModal
          taskTitle={deletingTask.title}
          onConfirm={handleDelete}
          onCancel={() => setDeletingTask(null)}
          loading={deleting}
        />
      )}
    </>
  )
}
