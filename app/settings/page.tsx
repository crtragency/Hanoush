'use client'

import { useEffect, useState, useRef } from 'react'
import AppShell from '@/components/AppShell'
import ProfileAvatar from '@/components/ProfileAvatar'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const positionSchema = z.object({
  position: z.string().min(2, 'Position must be at least 2 characters').max(100),
})
type PositionForm = z.infer<typeof positionSchema>

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<PositionForm>({
    resolver: zodResolver(positionSchema),
  })

  useEffect(() => {
    reset({ position: session?.user?.position || '' })
  }, [session, reset])

  const handlePositionSave = async (data: PositionForm) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: data.position }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Could not update position')
      }
      await update()
      reset({ position: data.position })
      toast.success('Position updated!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update position')
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WEBP image')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Upload failed')
      }
      const { url } = await res.json()

      const saveRes = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url }),
      })
      if (!saveRes.ok) {
        const err = await saveRes.json()
        throw new Error(err.error ?? 'Could not save photo')
      }
      await update()
      setPreview(null)
      toast.success('Profile photo updated!')
    } catch (err) {
      setPreview(null)
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = async () => {
    setUploading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: null }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Could not remove photo')
      }
      await update()
      setPreview(null)
      toast.success('Profile photo removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove photo')
    } finally {
      setUploading(false)
    }
  }

  const displayName = session?.user?.name || 'User'
  const currentPhoto = preview || session?.user?.image || null

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="font-playfair text-2xl md:text-3xl font-bold text-[#3D0026] dark:text-pink-50">Settings</h1>
          <p className="text-sm text-[#C2185B]/60 dark:text-pink-400/60 mt-0.5">Manage your profile and preferences</p>
        </div>

        {/* Account info */}
        {session?.user && (
          <div className="bg-white dark:bg-[#3d0030] rounded-2xl border border-pink-100 dark:border-[#E91E8C]/15 p-5 card-shadow">
            <h2 className="font-playfair text-base font-semibold text-[#3D0026] dark:text-pink-50 mb-4 flex items-center gap-2">
              <span className="text-base">👤</span> Account
            </h2>
            <div className="flex items-center gap-3">
              <ProfileAvatar name={displayName} photoUrl={session.user.image} size="md" />
              <div>
                <p className="text-sm font-semibold text-[#3D0026] dark:text-pink-100">{session.user.name}</p>
                <p className="text-xs text-gray-400 dark:text-pink-400/50">{session.user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Photo */}
        <div className="bg-white dark:bg-[#3d0030] rounded-2xl border border-pink-100 dark:border-[#E91E8C]/15 p-5 card-shadow">
          <h2 className="font-playfair text-base font-semibold text-[#3D0026] dark:text-pink-50 mb-4 flex items-center gap-2">
            <span>📷</span> Profile Photo
          </h2>
          <p className="text-xs text-gray-400 dark:text-pink-400/50 mb-4">
            Upload a photo shown across your dashboard.
          </p>
          <div className="flex items-center gap-5">
            <div className="relative">
              <ProfileAvatar
                name={displayName}
                photoUrl={currentPhoto}
                size="lg"
                className={uploading ? 'opacity-60' : ''}
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full">
                  <div className="w-6 h-6 rounded-full border-2 border-[#E91E8C] border-t-transparent animate-spin" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-primary text-sm py-2 px-4">
                  {session?.user?.image ? 'Change photo' : 'Upload photo'}
                </button>
                {session?.user?.image && (
                  <button onClick={handleRemovePhoto} disabled={uploading} className="btn-secondary text-sm py-2 px-4">
                    Remove photo
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-pink-400/50">JPG, PNG or WEBP · Max 2MB</p>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
        </div>

        {/* Position */}
        <div className="bg-white dark:bg-[#3d0030] rounded-2xl border border-pink-100 dark:border-[#E91E8C]/15 p-5 card-shadow">
          <h2 className="font-playfair text-base font-semibold text-[#3D0026] dark:text-pink-50 mb-4 flex items-center gap-2">
            <span>💼</span> Position
          </h2>
          <p className="text-xs text-gray-400 dark:text-pink-400/50 mb-4">
            Your role or title, shown under your name in the sidebar.
          </p>
          <form onSubmit={handleSubmit(handlePositionSave)} className="space-y-3">
            <div>
              <input
                {...register('position')}
                placeholder="e.g. Content Creator"
                className="input-base max-w-sm"
              />
              {errors.position && <p className="mt-1.5 text-xs text-red-500">{errors.position.message}</p>}
            </div>
            <button type="submit" className="btn-primary" disabled={!isDirty}>
              Save position
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
