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

interface Props {
  onSelectPlan: (id: string) => void
}

export default function OngoingDatesPage({ onSelectPlan }: Props) {
  const { data: plans = [], isLoading } = useQuery<DatePlan[]>({
    queryKey: ['ongoing-plans'],
    queryFn: fetchOngoingPlans,
    refetchInterval: 60_000,
  })

  return (
    <div className="page active">
      <div className="page-header">
        <div className="page-eyebrow">Coming up</div>
        <div className="page-title">Ongoing<br />dates</div>
      </div>

      {plans.length > 0 && (
        <ReminderBanner plans={plans} onSelectPlan={onSelectPlan} />
      )}

      {isLoading && (
        <div className="list-empty">Loading…</div>
      )}

      {!isLoading && plans.length === 0 && (
        <div className="list-empty">
          <span className="list-empty-icon">💕</span>
          <div>No upcoming dates yet.</div>
          <div style={{ fontSize: 12, marginTop: 6, color: 'var(--text-dim)' }}>
            Tap <strong style={{ color: 'var(--accent)' }}>+</strong> to plan one!
          </div>
        </div>
      )}

      <div className="date-list">
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
      <div className="pad-bottom" />
    </div>
  )
}
