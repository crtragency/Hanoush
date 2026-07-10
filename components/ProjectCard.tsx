'use client'

import Link from 'next/link'
import { Project } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

function ProgressRing({ progress, color }: { progress: number; color: string }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const offset = circ - (progress / 100) * circ
  return (
    <div className="relative w-12 h-12 flex-shrink-0">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" className="stroke-pink-100 dark:stroke-[#E91E8C]/15" />
        <circle
          cx="22" cy="22" r={r} fill="none" strokeWidth="4" strokeLinecap="round"
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#3D0026] dark:text-pink-100">
        {progress}%
      </span>
    </div>
  )
}

export default function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const remaining = project.taskCount - project.completedCount

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        'group relative block bg-white dark:bg-[#3d0030] rounded-2xl border border-pink-100 dark:border-[#E91E8C]/15 p-5 card-shadow overflow-hidden',
        'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-pink-200 dark:hover:border-[#E91E8C]/30'
      )}
    >
      {/* Accent bar */}
      <span className="absolute top-0 left-0 h-full w-1" style={{ backgroundColor: project.color }} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: `${project.color}1A`, color: project.color }}
          >
            {project.icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-playfair text-base font-bold text-[#3D0026] dark:text-pink-50 truncate">
              {project.name}
            </h3>
            <p className="text-xs text-[#C2185B]/60 dark:text-pink-400/60 truncate">
              {project.taskCount === 0
                ? 'No tasks yet'
                : `${remaining} pending · ${project.completedCount} done`}
            </p>
          </div>
        </div>

        {/* Actions (hover) */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.preventDefault(); onEdit(project) }}
            title="Edit project"
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onDelete(project) }}
            title="Delete project"
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {project.description && (
        <p className="text-xs text-gray-400 dark:text-pink-300/50 mt-3 line-clamp-2 leading-relaxed">
          {project.description}
        </p>
      )}

      {/* Footer: progress */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-pink-50 dark:border-[#E91E8C]/10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-pink-300/60">
            {project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}
          </span>
          {project.taskCount > 0 && remaining === 0 && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">🎉 Complete</span>
          )}
        </div>
        <ProgressRing progress={project.progress} color={project.color} />
      </div>
    </Link>
  )
}
