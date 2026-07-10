'use client'

import { useState } from 'react'

interface ProjectDeleteModalProps {
  projectName: string
  taskCount: number
  onConfirm: (withTasks: boolean) => void
  onCancel: () => void
  loading?: boolean
}

export default function ProjectDeleteModal({
  projectName,
  taskCount,
  onConfirm,
  onCancel,
  loading,
}: ProjectDeleteModalProps) {
  const [withTasks, setWithTasks] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onCancel}>
      <div
        className="animate-scale-in bg-white dark:bg-[#2d0020] w-full max-w-sm rounded-2xl shadow-2xl border border-pink-200/60 dark:border-[#E91E8C]/30 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="font-playfair text-lg font-bold text-[#3D0026] dark:text-pink-200 mb-1">
            Delete Project
          </h3>
          <p className="text-sm text-gray-500 dark:text-pink-300/60">
            Delete{' '}
            <span className="font-semibold text-[#3D0026] dark:text-pink-300 italic">
              &ldquo;{projectName}&rdquo;
            </span>
            ? This can&apos;t be undone.
          </p>
        </div>

        {taskCount > 0 && (
          <label className="flex items-start gap-2.5 mb-5 p-3 rounded-xl bg-pink-50/70 dark:bg-[#3d0030] cursor-pointer">
            <input
              type="checkbox"
              checked={withTasks}
              onChange={(e) => setWithTasks(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#C2185B]"
            />
            <span className="text-xs text-gray-600 dark:text-pink-300/70 leading-relaxed">
              Also delete the{' '}
              <span className="font-semibold">{taskCount} {taskCount === 1 ? 'task' : 'tasks'}</span> in
              this project.{' '}
              {!withTasks && (
                <span className="text-gray-400 dark:text-pink-400/50">
                  Otherwise they move to your Inbox.
                </span>
              )}
            </span>
          </label>
        )}

        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(withTasks)}
            disabled={loading}
            className="flex-1 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-medium hover:opacity-90 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
