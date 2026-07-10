'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Project, ProjectFormData } from '@/lib/types'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Project name is required').max(80, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
})

// A curated palette + icon set so every new project looks intentional.
export const PROJECT_COLORS = [
  '#E91E8C', '#C2185B', '#7C3AED', '#6366F1',
  '#0EA5E9', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#14B8A6',
]

export const PROJECT_ICONS = [
  '📁', '🚀', '💼', '🎯', '💡', '🎨', '📚', '🏆',
  '💻', '📈', '🛠️', '🌱', '🔥', '⭐', '🧩', '🏠',
  '❤️', '🎵', '✈️', '🍽️',
]

interface ProjectFormModalProps {
  mode: 'add' | 'edit'
  project?: Project | null
  onClose: () => void
  onSubmit: (data: ProjectFormData) => Promise<void>
  loading?: boolean
}

export default function ProjectFormModal({
  mode,
  project,
  onClose,
  onSubmit,
  loading,
}: ProjectFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{ name: string; description?: string }>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? '',
      description: project?.description ?? '',
    },
  })

  const [color, setColor] = useState(project?.color ?? PROJECT_COLORS[0])
  const [icon, setIcon] = useState(project?.icon ?? PROJECT_ICONS[0])

  useEffect(() => {
    if (mode === 'edit' && project) {
      reset({ name: project.name, description: project.description ?? '' })
      setColor(project.color)
      setIcon(project.icon)
    }
  }, [project, mode, reset])

  const onFormSubmit = async (data: { name: string; description?: string }) => {
    await onSubmit({ ...data, color, icon })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div
        className="animate-scale-in bg-white dark:bg-[#2d0020] w-full max-w-lg rounded-2xl shadow-2xl border border-pink-100 dark:border-[#E91E8C]/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-pink-50 dark:border-[#E91E8C]/15 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm transition-colors"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {icon}
            </div>
            <h2 className="font-playfair text-lg font-bold text-[#3D0026] dark:text-pink-50">
              {mode === 'add' ? 'New Project' : 'Edit Project'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-pink-50 dark:hover:bg-[#E91E8C]/10 transition-colors text-gray-400 dark:text-pink-400/60"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#3D0026] dark:text-pink-200 mb-1.5">
              Project name <span className="text-[#C2185B]">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="e.g. Website Redesign"
              className="input-base"
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D0026] dark:text-pink-200 mb-1.5">
              Description
            </label>
            <textarea
              {...register('description')}
              placeholder="What is this project about? (optional)"
              rows={2}
              className="input-base resize-none"
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-sm font-medium text-[#3D0026] dark:text-pink-200 mb-2">Icon</label>
            <div className="grid grid-cols-10 gap-1.5">
              {PROJECT_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={cn(
                    'aspect-square rounded-lg flex items-center justify-center text-lg transition-all duration-150',
                    icon === ic
                      ? 'ring-2 ring-offset-1 dark:ring-offset-[#2d0020] scale-105'
                      : 'bg-pink-50 dark:bg-[#3d0030] hover:scale-105'
                  )}
                  style={icon === ic ? { backgroundColor: `${color}22`, '--tw-ring-color': color } as React.CSSProperties : undefined}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-[#3D0026] dark:text-pink-200 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all duration-150',
                    color === c ? 'ring-2 ring-offset-2 dark:ring-offset-[#2d0020] scale-110' : 'hover:scale-110'
                  )}
                  style={{ backgroundColor: c, ['--tw-ring-color' as string]: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : mode === 'add' ? 'Create Project ✨' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
