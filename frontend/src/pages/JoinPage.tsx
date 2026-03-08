import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth, SignIn } from '@clerk/react'
import { joinPlan, fetchPlanPreview } from '../lib/api'

interface PlanPreview {
  id: string
  title: string
  confirmedDate?: string
  confirmedTimeSlot?: string
  locations: { name: string; emoji: string; gradientFrom: string; gradientTo: string }[]
  members: { user: { name: string } }[]
}

export default function JoinPage() {
  const { token } = useParams<{ token: string }>()
  const { isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()
  const [preview, setPreview] = useState<PlanPreview | null>(null)

  // Load plan preview (no auth needed)
  useEffect(() => {
    if (!token) return
    fetchPlanPreview(token).then(setPreview).catch(() => {})
  }, [token])

  // Auto-join once signed in
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !token) return
    joinPlan(token)
      .then(({ planId }: { planId: string }) => navigate(`/plan/${planId}`))
      .catch(() => navigate('/dashboard'))
  }, [isLoaded, isSignedIn, token, navigate])

  if (!isLoaded) return null

  const location = preview?.locations?.[0]
  const gradient = location
    ? `linear-gradient(135deg, ${location.gradientFrom}, ${location.gradientTo})`
    : 'linear-gradient(135deg, #E8956D, #C4622D)'

  const dateLabel = preview?.confirmedDate
    ? new Date(preview.confirmedDate).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      })
    : null

  return (
    <div className="auth-bg">
      <div className="join-card">
        {/* Plan preview banner */}
        {preview && (
          <div className="join-plan-preview" style={{ background: gradient }}>
            <div className="join-plan-emoji">{location?.emoji ?? '💕'}</div>
            <div className="join-plan-title">{preview.title}</div>
            {dateLabel && <div className="join-plan-date">📅 {dateLabel}</div>}
            {location && <div className="join-plan-location">{location.name}</div>}
            <div className="join-plan-members">
              {preview.members.slice(0, 3).map((m, i) => (
                <div key={i} className="join-member-chip">{m.user.name}</div>
              ))}
              {preview.members.length > 3 && (
                <div className="join-member-chip">+{preview.members.length - 3} more</div>
              )}
            </div>
          </div>
        )}

        {!isSignedIn ? (
          <div className="join-signin-wrap">
            <div className="join-heading">
              {preview ? "You're invited!" : 'Join the date plan'}
            </div>
            <div className="join-sub">Sign in to view and co-edit the plan</div>
            <SignIn fallbackRedirectUrl={`/join/${token}`} />
          </div>
        ) : (
          <div className="join-joining">
            <div className="join-spinner" />
            <div>Joining plan…</div>
          </div>
        )}
      </div>
    </div>
  )
}
