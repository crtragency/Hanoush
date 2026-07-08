'use client'

import { useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import ProfileAvatar from './ProfileAvatar'

// Shown the first time a user signs in, before they've set a position.
// They enter their position/role and (optionally) upload a profile photo.
export default function ProfileSetupPrompt() {
  const { data: session, update } = useSession()
  const [position, setPosition] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const displayName = session?.user?.name || 'there'

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a JPG, PNG, or WEBP image')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB')
      return
    }
    setError('')

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
      setPhoto(url)
    } catch (err) {
      setPreview(null)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = position.trim()
    if (trimmed.length < 2) {
      setError('Please enter your position')
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: trimmed, image: photo }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Could not save your profile')
      }
      // Refresh the session so the new position/photo flow through the app.
      await update()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="animate-scale-in bg-white dark:bg-plum-dark rounded-2xl p-8 shadow-2xl w-full max-w-sm mx-4 border border-pink-200/60 dark:border-plum-light/30">
        <div className="text-center mb-6">
          <h2 className="font-playfair text-2xl font-bold text-plum dark:text-pink-200 mb-2">
            Welcome, {displayName}! 🌸
          </h2>
          <p className="text-sm text-gray-500 dark:text-pink-300/60">
            Add your position and a photo to personalize your dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <ProfileAvatar
                name={displayName}
                photoUrl={preview || photo}
                size="lg"
                className={uploading ? 'opacity-60' : ''}
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full">
                  <div className="w-6 h-6 rounded-full border-2 border-[#E91E8C] border-t-transparent animate-spin" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              {photo ? 'Change photo' : 'Upload photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-plum dark:text-pink-300 mb-1.5">
              What&apos;s your position?
            </label>
            <input
              type="text"
              value={position}
              onChange={(e) => {
                setPosition(e.target.value)
                setError('')
              }}
              placeholder="e.g. Content Creator"
              className="input-base"
              autoFocus
              maxLength={100}
            />
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <button type="submit" className="btn-primary w-full text-center" disabled={saving || uploading}>
            {saving ? 'Saving...' : "Let's get started ✨"}
          </button>
        </form>
      </div>
    </div>
  )
}
