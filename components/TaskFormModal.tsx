'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Task, TaskFormData, Project } from '@/lib/types'
import { formatDateInput } from '@/lib/utils'
import toast from 'react-hot-toast'
import Image from 'next/image'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
})

interface TaskFormModalProps {
  mode: 'add' | 'edit'
  task?: Task | null
  onClose: () => void
  onSubmit: (data: TaskFormData) => Promise<void>
  loading?: boolean
  // When provided, a project picker is shown so the task can be filed under one.
  projects?: Project[]
}

export default function TaskFormModal({
  mode,
  task,
  onClose,
  onSubmit,
  loading,
  projects,
}: TaskFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Omit<TaskFormData, 'imageUrl'>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      dueDate: task?.dueDate ? formatDateInput(task.dueDate) : '',
      priority: task?.priority ?? 'MEDIUM',
    },
  })

  const [imageUrl, setImageUrl] = useState<string | null>(task?.imageUrl ?? null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(task?.projectId ?? null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === 'edit' && task) {
      reset({
        title: task.title,
        description: task.description ?? '',
        dueDate: task.dueDate ? formatDateInput(task.dueDate) : '',
        priority: task.priority,
      })
      setImageUrl(task.imageUrl ?? null)
      setImagePreview(null)
      setProjectId(task.projectId ?? null)
    }
  }, [task, mode, reset])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WEBP image')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB')
      return
    }

    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setImageUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Upload failed')
      }
      const { url } = await res.json()
      setImageUrl(url)
      setImagePreview(null)
      toast.success('Image attached!')
    } catch (err) {
      setImagePreview(null)
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setImageUploading(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const handleRemoveImage = () => {
    setImageUrl(null)
    setImagePreview(null)
  }

  const onFormSubmit = async (formData: Omit<TaskFormData, 'imageUrl'>) => {
    await onSubmit({
      ...formData,
      imageUrl,
      ...(projects ? { projectId } : {}),
    })
  }

  const currentImage = imagePreview || imageUrl

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div
        className="animate-scale-in bg-white dark:bg-[#2d0020] w-full max-w-lg rounded-2xl shadow-2xl border border-pink-100 dark:border-[#E91E8C]/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-pink-50 dark:border-[#E91E8C]/15 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#C2185B] to-[#E91E8C] flex items-center justify-center">
              <span className="text-white text-xs font-bold">{mode === 'add' ? '+' : '✏'}</span>
            </div>
            <h2 className="font-playfair text-lg font-bold text-[#3D0026] dark:text-pink-50">
              {mode === 'add' ? 'New Task' : 'Edit Task'}
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
              Task title <span className="text-[#C2185B]">*</span>
            </label>
            <input
              {...register('title')}
              placeholder="What do you need to do?"
              className="input-base"
              autoFocus
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D0026] dark:text-pink-200 mb-1.5">
              Description
            </label>
            <textarea
              {...register('description')}
              placeholder="Add more details (optional)"
              rows={2}
              className="input-base resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#3D0026] dark:text-pink-200 mb-1.5">Due date</label>
              <input type="date" {...register('dueDate')} className="input-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D0026] dark:text-pink-200 mb-1.5">Priority</label>
              <select {...register('priority')} className="input-base">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          {/* Project picker (only when a project list is supplied) */}
          {projects && (
            <div>
              <label className="block text-sm font-medium text-[#3D0026] dark:text-pink-200 mb-1.5">Project</label>
              <select
                value={projectId ?? ''}
                onChange={(e) => setProjectId(e.target.value || null)}
                className="input-base"
              >
                <option value="">📥 Inbox (no project)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Image attachment */}
          <div>
            <label className="block text-sm font-medium text-[#3D0026] dark:text-pink-200 mb-1.5">
              Attachment
            </label>
            {currentImage ? (
              <div className="relative rounded-xl overflow-hidden border border-pink-100 dark:border-[#E91E8C]/20 bg-pink-50 dark:bg-[#3d0030]">
                <div className="relative h-36 w-full">
                  <Image
                    src={currentImage}
                    alt="Task attachment"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {imageUploading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full border-2 border-[#C2185B] border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={imageUploading}
                className="w-full py-3 border-2 border-dashed border-pink-200 dark:border-[#E91E8C]/20 hover:border-[#C2185B] dark:hover:border-[#E91E8C] rounded-xl text-sm text-gray-400 dark:text-pink-400/50 hover:text-[#C2185B] dark:hover:text-[#E91E8C] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Add image
              </button>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading || imageUploading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : mode === 'add' ? 'Add Task ✨' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
