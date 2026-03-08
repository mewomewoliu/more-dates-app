import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { fetchOngoingPlans } from '../lib/api'
import { DatePlan } from '../types'
import ReminderBanner from '../components/ReminderBanner'

const TIME_SLOT_LABEL: Record<string, string> = {
  afternoon: '☀️ Afternoon',
  evening: '🌆 Evening',
  night: '🌙 Night',
  allday: '🌅 All day',
}

const DATE_TIPS = [
  { emoji: '🌙', title: 'Golden hour picnic', desc: 'Pack a blanket, bring snacks, watch the sky turn pink', color: '#C4622D' },
  { emoji: '🍝', title: 'Cook together', desc: 'Pick a recipe neither of you has ever tried', color: '#5A8F7A' },
  { emoji: '🎭', title: 'Surprise each other', desc: 'Each plans half the night — in total secrecy', color: '#7B5EA7' },
  { emoji: '🎨', title: 'Make something', desc: 'Pottery, painting, candles — create a memory to keep', color: '#8B7355' },
  { emoji: '🌿', title: 'Nature escape', desc: 'Find a trail and get just a little bit lost together', color: '#4A7A5A' },
]

const LOVE_NOTES = [
  { quote: 'The best dates aren\'t planned — they\'re felt.', tag: 'On spontaneity' },
  { quote: 'Every great love story begins with someone saying: let\'s do something tonight.', tag: 'On beginning' },
  { quote: 'Time flies when you\'re with the right person. So plan more of it.', tag: 'On time' },
]

function InspirationSection() {
  const note = LOVE_NOTES[Math.floor(Date.now() / 86400000) % LOVE_NOTES.length]
  return (
    <div className="inspo-wrap">
      <div className="inspo-divider">
        <span className="inspo-divider-text">✦ inspiration</span>
      </div>
      <div className="es-section-label" style={{ padding: '0 24px' }}>Date ideas to try</div>
      <div className="es-tips-track" style={{ paddingLeft: 24, paddingRight: 24 }}>
        {DATE_TIPS.map((tip, i) => (
          <div key={i} className="es-tip-card" style={{ '--tip-color': tip.color } as React.CSSProperties}>
            <div className="es-tip-emoji">{tip.emoji}</div>
            <div className="es-tip-title">{tip.title}</div>
            <div className="es-tip-desc">{tip.desc}</div>
          </div>
        ))}
      </div>
      <div className="es-section-label" style={{ marginTop: 20, padding: '0 24px' }}>Love note of the day</div>
      <div className="es-love-note" style={{ margin: '0 24px' }}>
        <div className="es-love-ornament">❝</div>
        <div className="es-love-quote">{note.quote}</div>
        <div className="es-love-tag">{note.tag}</div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="es-wrap">
      <div className="es-glow" />
      <div className="es-heading">
        <div className="es-eyebrow">✦ Your journey awaits</div>
        <div className="es-title">No dates yet,<br />but <em>love</em> finds<br />a way</div>
        <div className="es-subtitle">Plan your first date and watch this page come alive.</div>
      </div>
      <div className="es-section-label">Your story so far</div>
      <div className="es-stats-row">
        {([
          { emoji: '💕', value: '0', label: 'Dates planned' },
          { emoji: '📍', value: '0', label: 'Places explored' },
          { emoji: '✨', value: '0', label: 'Memories made' },
        ] as const).map((s, i) => (
          <div key={i} className="es-stat-card" style={{ animationDelay: `${0.1 + i * 0.09}s` }}>
            <div className="es-stat-emoji">{s.emoji}</div>
            <div className="es-stat-value">{s.value}</div>
            <div className="es-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface Props {
  onSelectPlan: (id: string) => void
}

export default function OngoingDatesPage({ onSelectPlan }: Props) {
  const navigate = useNavigate()
  const { user } = useUser()
  const { data: plans = [], isLoading } = useQuery<DatePlan[]>({
    queryKey: ['ongoing-plans'],
    queryFn: fetchOngoingPlans,
    refetchInterval: 60_000,
  })

  const initials = (user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? '?')[0]?.toUpperCase()

  return (
    <div className="page active">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-eyebrow">Coming up</div>
          <div className="page-title">Ongoing<br />dates</div>
        </div>
        <button className="profile-nav-btn" onClick={() => navigate('/profile')} title="Account">
          {initials}
        </button>
      </div>

      {plans.length > 0 && (
        <ReminderBanner plans={plans} onSelectPlan={onSelectPlan} />
      )}

      {isLoading && (
        <div className="list-empty">Loading…</div>
      )}

      {!isLoading && plans.length === 0 && <EmptyState />}

      <div className="date-list" style={{ marginBottom: plans.length > 0 ? 0 : undefined }}>
        {plans.map(plan => {
          const location = plan.confirmedLocationId
            ? plan.locations?.find(l => l.id === plan.confirmedLocationId)
            : plan.locations?.[0]
          const dateLabel = plan.confirmedDate
            ? new Date(plan.confirmedDate).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              })
            : null
          const timeLabel = plan.confirmedTimeSlot
            ? TIME_SLOT_LABEL[plan.confirmedTimeSlot]
            : null
          const daysUntil = plan.confirmedDate
            ? Math.ceil((new Date(plan.confirmedDate).getTime() - Date.now()) / 86400000)
            : null

          return (
            <div key={plan.id} className="date-card" onClick={() => onSelectPlan(plan.id)}>
              <div className="date-card-accent" style={{
                background: location
                  ? `linear-gradient(135deg, ${location.gradientFrom}, ${location.gradientTo})`
                  : 'linear-gradient(135deg, #E8956D, #C4622D)',
              }} />
              <div className="date-card-body">
                <div className="date-card-top">
                  <div className="date-card-title">{plan.title}</div>
                  {daysUntil !== null && (
                    <div className={`date-card-countdown${daysUntil === 0 ? ' today-badge' : ''}`}>
                      {daysUntil === 0 ? '💕 Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                    </div>
                  )}
                </div>
                <div className="date-card-meta">
                  {dateLabel && <span>📅 {dateLabel}</span>}
                  {timeLabel && <span>{timeLabel}</span>}
                  {location && <span>{location.emoji} {location.name}</span>}
                </div>
                {plan.activities && plan.activities.length > 0 && (
                  <div className="date-card-activities">
                    {plan.activities.slice(0, 3).map((a, i) => (
                      <span key={i} className="activity-pill">{a.emoji} {a.name}</span>
                    ))}
                    {plan.activities.length > 3 && (
                      <span className="activity-pill">+{plan.activities.length - 3}</span>
                    )}
                  </div>
                )}
                <div className="date-card-members">
                  {plan.members?.slice(0, 3).map((m, i) => (
                    <div
                      key={m.id}
                      className="mini-avatar"
                      style={{
                        background: i % 2 === 0
                          ? 'linear-gradient(135deg, #E8956D, #C4622D)'
                          : 'linear-gradient(135deg, #8BAF9E, #5A8F7A)',
                      }}
                    >
                      {m.user.name[0].toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!isLoading && <InspirationSection />}
      <div className="pad-bottom" />
    </div>
  )
}
