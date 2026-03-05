import { useQuery } from '@tanstack/react-query'
import { fetchPastPlans } from '../lib/api'
import { DatePlan } from '../types'

interface Props {
  onSelectPlan: (id: string) => void
}

export default function MemoriesPage({ onSelectPlan }: Props) {
  const { data: plans = [], isLoading } = useQuery<DatePlan[]>({
    queryKey: ['past-plans'],
    queryFn: fetchPastPlans,
    refetchInterval: 60_000,
  })

  return (
    <div className="page active">
      <div className="page-header">
        <div className="page-eyebrow">Look back</div>
        <div className="page-title">Memories</div>
      </div>

      {isLoading && <div className="list-empty">Loading…</div>}

      {!isLoading && plans.length === 0 && (
        <div className="list-empty">
          <span className="list-empty-icon">🌙</span>
          <div>No memories yet.</div>
          <div style={{ fontSize: 12, marginTop: 6, color: 'var(--text-dim)' }}>
            Past dates will appear here automatically.
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
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })
            : null

          return (
            <div key={plan.id} className="date-card memory-card" onClick={() => onSelectPlan(plan.id)}>
              <div className="date-card-accent" style={{
                background: location
                  ? `linear-gradient(135deg, ${location.gradientFrom}, ${location.gradientTo})`
                  : 'linear-gradient(135deg, #5A4A3C, #3D2A1E)',
                opacity: 0.6,
              }} />
              <div className="date-card-body">
                <div className="date-card-top">
                  <div className="date-card-title">{plan.title}</div>
                  <div className="memory-badge">Memory</div>
                </div>
                {dateLabel && (
                  <div className="date-card-meta">
                    <span>📅 {dateLabel}</span>
                    {location && <span>{location.emoji} {location.name}</span>}
                  </div>
                )}
                {plan.activities && plan.activities.length > 0 && (
                  <div className="date-card-activities">
                    {plan.activities.slice(0, 4).map((a, i) => (
                      <span key={i} className="activity-pill memory-pill">{a.emoji} {a.name}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="pad-bottom" />
    </div>
  )
}
