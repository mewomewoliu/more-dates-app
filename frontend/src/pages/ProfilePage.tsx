import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchMe, updateMe } from '../lib/api'

interface UserProfile {
  id: string
  name: string
  email: string
  createdAt: string
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user } = useUser()
  const { signOut } = useClerk()
  const queryClient = useQueryClient()

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['me'],
    queryFn: fetchMe,
  })

  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile?.name) setName(profile.name)
  }, [profile?.name])

  const { mutate: saveName, isPending } = useMutation({
    mutationFn: () => updateMe({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const initials = (name || user?.firstName || '?')[0]?.toUpperCase()

  return (
    <div className="phone-wrapper">
      <div className="phone">
        <div className="profile-page">
          {/* Header */}
          <div className="profile-header">
            <button className="profile-back" onClick={() => navigate('/dashboard')}>
              ← Back
            </button>
            <div className="profile-header-title">Account</div>
            <div style={{ width: 60 }} />
          </div>

          {/* Avatar */}
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-avatar-name">{profile?.name ?? user?.firstName ?? ''}</div>
            <div className="profile-avatar-email">{profile?.email ?? user?.primaryEmailAddress?.emailAddress}</div>
          </div>

          {/* Edit form */}
          <div className="profile-section">
            <div className="profile-section-label">Display name</div>
            <div className="profile-field-row">
              <input
                className="profile-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={60}
              />
              <button
                className="profile-save-btn"
                onClick={() => saveName()}
                disabled={isPending || !name.trim()}
              >
                {saved ? '✓' : isPending ? '…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="profile-section">
            <div className="profile-section-label">Account info</div>
            <div className="profile-info-row">
              <span className="profile-info-key">Email</span>
              <span className="profile-info-val">{profile?.email ?? '—'}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-key">Member since</span>
              <span className="profile-info-val">
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : '—'}
              </span>
            </div>
          </div>

          {/* Sign out */}
          <div className="profile-section">
            <button
              className="profile-signout-btn"
              onClick={() => signOut(() => navigate('/'))}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
