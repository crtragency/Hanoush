'use client'

import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/AppShell'
import ProjectCard from '@/components/ProjectCard'
import ProjectFormModal from '@/components/ProjectFormModal'
import ProjectDeleteModal from '@/components/ProjectDeleteModal'
import DBErrorBanner from '@/components/DBErrorBanner'
import { Project, ProjectFormData } from '@/lib/types'
import toast from 'react-hot-toast'

function ProjectCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#3d0030] rounded-2xl border border-pink-100 dark:border-[#E91E8C]/15 p-5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-pink-100 dark:bg-[#E91E8C]/15" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-1/2 rounded bg-pink-100 dark:bg-[#E91E8C]/15" />
          <div className="h-2.5 w-1/3 rounded bg-pink-50 dark:bg-[#E91E8C]/10" />
        </div>
      </div>
      <div className="h-px bg-pink-50 dark:bg-[#E91E8C]/10 my-4" />
      <div className="flex items-center justify-between">
        <div className="h-2.5 w-16 rounded bg-pink-50 dark:bg-[#E91E8C]/10" />
        <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-[#E91E8C]/15" />
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchProjects = useCallback(async () => {
    setDbError(null)
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      if (!res.ok) { setDbError(data.error ?? 'Failed to fetch projects'); return }
      setProjects(data.projects)
    } catch {
      setDbError('Network error — could not reach the server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleAdd = async (data: ProjectFormData) => {
    setSaving(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Failed to create project'); return }
      setProjects((prev) => [...prev, json])
      setShowAddModal(false)
      toast.success('Project created! 🎉')
    } catch {
      toast.error('Failed to create project')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (data: ProjectFormData) => {
    if (!editingProject) return
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Failed to update project'); return }
      setProjects((prev) =>
        prev.map((p) => (p.id === json.id ? { ...p, ...json } : p))
      )
      setEditingProject(null)
      toast.success('Project updated!')
    } catch {
      toast.error('Failed to update project')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (withTasks: boolean) => {
    if (!deletingProject) return
    setDeleting(true)
    try {
      const url = `/api/projects/${deletingProject.id}${withTasks ? '?withTasks=1' : ''}`
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id))
      setDeletingProject(null)
      toast.success('Project deleted')
    } catch {
      toast.error('Failed to delete project')
    } finally {
      setDeleting(false)
    }
  }

  const totalTasks = projects.reduce((sum, p) => sum + p.taskCount, 0)
  const totalDone = projects.reduce((sum, p) => sum + p.completedCount, 0)

  return (
    <>
      <AppShell>
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-playfair text-2xl md:text-3xl font-bold text-[#3D0026] dark:text-pink-50">Projects</h1>
              <p className="text-sm text-[#C2185B]/60 dark:text-pink-400/60 mt-0.5">
                {projects.length === 0
                  ? 'Organize your tasks into projects'
                  : `${projects.length} ${projects.length === 1 ? 'project' : 'projects'} · ${totalDone}/${totalTasks} tasks done`}
              </p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Project</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>

          {dbError ? (
            <DBErrorBanner message={dbError} />
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <ProjectCardSkeleton key={i} />)}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C2185B] to-[#E91E8C] flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl">🚀</span>
              </div>
              <p className="font-playfair text-lg font-semibold text-[#3D0026] dark:text-pink-50 mb-1">
                No projects yet
              </p>
              <p className="text-sm text-gray-400 dark:text-pink-300/50 mb-5">
                Create your first project to organize your tasks
              </p>
              <button onClick={() => setShowAddModal(true)} className="btn-primary inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={setEditingProject}
                  onDelete={setDeletingProject}
                />
              ))}
            </div>
          )}
        </div>
      </AppShell>

      {showAddModal && (
        <ProjectFormModal mode="add" onClose={() => setShowAddModal(false)} onSubmit={handleAdd} loading={saving} />
      )}
      {editingProject && (
        <ProjectFormModal
          mode="edit"
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSubmit={handleEdit}
          loading={saving}
        />
      )}
      {deletingProject && (
        <ProjectDeleteModal
          projectName={deletingProject.name}
          taskCount={deletingProject.taskCount}
          onConfirm={handleDelete}
          onCancel={() => setDeletingProject(null)}
          loading={deleting}
        />
      )}
    </>
  )
}
