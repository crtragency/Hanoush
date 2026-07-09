'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Image from 'next/image'
import { Task } from '@/lib/types'
import { formatDate, isOverdue, cn } from '@/lib/utils'
import PriorityBadge from './PriorityBadge'

interface TaskCardProps {
  task: Task
  onToggle: (id: string, completed: boolean) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onRemoveImage: (id: string) => void
}

export default function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  onRemoveImage,
}: TaskCardProps) {
  const [toggling, setToggling] = useState(false)
  const [imageExpanded, setImageExpanded] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const overdue = !task.completed && isOverdue(task.dueDate)

  const handleToggle = async () => {
    setToggling(true)
    await onToggle(task.id, !task.completed)
    setToggling(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white dark:bg-[#3d0030] rounded-2xl border border-pink-100 dark:border-[#E91E8C]/15 p-4 group transition-all duration-200',
        'hover:shadow-md hover:border-pink-200 dark:hover:border-[#E91E8C]/30 hover:-translate-y-0.5',
        task.completed && 'opacity-60',
        isDragging && 'shadow-xl scale-105 z-50',
        overdue && !task.completed && 'border-red-200 bg-red-50/30 dark:border-red-700/30 dark:bg-red-900/10'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-200 dark:text-pink-400/20 hover:text-pink-300 dark:hover:text-pink-400/50 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Drag to reorder"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 4.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM15 4.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM9 10.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM15 10.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM9 16.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM15 16.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
          </svg>
        </button>

        {/* Checkbox */}
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={cn(
            'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 mt-0.5',
            task.completed
              ? 'bg-gradient-to-br from-[#C2185B] to-[#E91E8C] border-transparent'
              : 'border-pink-200 dark:border-[#E91E8C]/30 hover:border-[#C2185B] dark:hover:border-[#E91E8C]',
            toggling && 'opacity-50'
          )}
          aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {task.completed && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              'text-sm font-semibold text-[#3D0026] dark:text-pink-100 leading-snug',
              task.completed && 'line-through opacity-60'
            )}>
              {task.title}
            </p>
            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(task)}
                title="Edit"
                className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(task)}
                title="Delete"
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-gray-400 dark:text-pink-300/50 mt-0.5 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <PriorityBadge priority={task.priority} />
            {task.dueDate && (
              <span className={cn(
                'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                overdue
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-[#3d0030] dark:text-pink-300/60'
              )}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {overdue ? 'Overdue · ' : ''}{formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Task image thumbnail */}
      {task.imageUrl && (
        <div className="mt-3 ml-8 relative">
          <div
            className={cn(
              'relative rounded-xl overflow-hidden border border-pink-100 dark:border-[#E91E8C]/20 cursor-pointer transition-all duration-200',
              imageExpanded ? 'h-48' : 'h-24'
            )}
            onClick={() => setImageExpanded(!imageExpanded)}
          >
            <Image
              src={task.imageUrl}
              alt="Task attachment"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
          </div>
          <button
            onClick={() => onRemoveImage(task.id)}
            className="absolute top-1.5 right-1.5 w-5 h-5 bg-white/90 dark:bg-[#2d0020]/90 rounded-full shadow flex items-center justify-center text-gray-400 dark:text-pink-300/60 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            title="Remove image"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#3d0030] rounded-2xl border border-pink-100 dark:border-[#E91E8C]/15 p-4">
      <div className="flex items-start gap-3">
        <div className="skeleton w-5 h-5 rounded-full mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 rounded w-3/4" />
          <div className="skeleton h-3 rounded w-1/2" />
          <div className="flex gap-2 mt-2">
            <div className="skeleton h-5 w-16 rounded-full" />
            <div className="skeleton h-5 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
