import { useEffect, useRef } from 'react'
import { DatePlan, TabName } from '../types'
import { useToast } from '../contexts/ToastContext'

const FEED_ACTION_LABELS: Record<string, (details: Record<string, unknown>, name: string) => string> = {
  created_plan: (_, name) => `${name} created this date plan ✨`,
  added_location: (d, name) => `${name} suggested "${d.name}"`,
  added_activity: (d, name) => `${name} added "${d.name}" to activities`,
  voted_location: (d, name) => `${name} voted ${d.value === 'yes' ? '❤️' : '✕'} for ${d.locationName}`,
  set_date: (d, name) => `${name} set the date to ${d.date ?? d.timeSlot}`,
  joined_plan: (_, name) => `${name} joined the plan`,
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface Props {
  plan: DatePlan
  currentUserId: string
  onTabChange: (tab: TabName) => void
  onShareOpen: () => void
  typingUser: string | null
}

export default function OverviewPage({ plan, currentUserId, onTabChange, onShareOpen, typingUser }: Props) {
  const { showToast: _showToast } = useToast()
  const fillRef = useRef<HTMLDivElement>(null)

  const whenDone = plan.whenOptions.some(o => o.date || o.timeSlot)
  const whereDone = plan.locations.some(l => l.votes.some(v => v.value === 'yes'))
  const whatDone = plan.activities.filter(a => a.checked).length
  const pct = Math.round(
    ((whenDone ? 34 : 0) + (whereDone ? 33 : 0) + (whatDone > 0 ? 33 : 0))
  )

  useEffect(() => {
    const el = fillRef.current
    if (!el) return
    const t = setTimeout(() => { el.style.width = `${pct}%` }, 400)
    return () => clearTimeout(t)
  }, [pct])

  const selectedDate = plan.whenOptions.find(o => o.date)
  const dateLabel = selectedDate?.date
    ? new Date(selectedDate.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : undefined
  const timeLabel = plan.whenOptions.find(o => o.timeSlot)?.timeSlot

  const avatarColors = ['#E8956D,#C4622D', '#8BAF9E,#5A8F7A', '#C4A882,#8B7355']

  return (
    <div className="page active" id="page-overview">
      {/* Hero */}
      <div className="overview-hero">
        <div className="app-eyebrow">Planning together</div>
        <div className="date-title">
          Our <em>perfect</em><br />spring date
        </div>
        <div className="planners-row">
          <div className="planner-avatars">
            {plan.members.slice(0, 3).map((m, i) => {
              const [from, to] = avatarColors[i % avatarColors.length].split(',')
              return (
                <div
                  key={m.id}
                  className="avatar"
                  style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                >
                  {m.user.name[0].toUpperCase()}
                  {m.userId === currentUserId && <div className="online-dot" />}
                </div>
              )
            })}
          </div>
          <div className="planner-meta">
            <div className="planner-names">
              {plan.members.map(m => m.user.name.split(' ')[0]).join(' & ')}
            </div>
            <div className="planner-status">
              Planning since {new Date(plan.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="live-badge">
            <div className="live-pulse" />
            Live
          </div>
        </div>
      </div>

      <button className="share-header-btn" onClick={onShareOpen}>
        &#128279; Share
      </button>

      {/* Progress */}
      <div className="progress-card">
        <div className="progress-header">
          <span className="progress-label">Plan complete</span>
          <span className="progress-pct">{pct}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" ref={fillRef} />
        </div>
        <div className="progress-items">
          <div className="prog-item">
            <div className="prog-item-label">When</div>
            <div className={`prog-item-val ${whenDone ? 'done' : ''}`}>
              {dateLabel ?? (timeLabel ?? 'TBD')}
            </div>
          </div>
          <div className="prog-item">
            <div className="prog-item-label">Where</div>
            <div className={`prog-item-val ${whereDone ? 'done' : ''}`}>
              {plan.locations.length === 0 ? 'No ideas yet' : `${plan.locations.length} option${plan.locations.length > 1 ? 's' : ''}`}
            </div>
          </div>
          <div className="prog-item">
            <div className="prog-item-label">Activities</div>
            <div className={`prog-item-val ${whatDone > 0 ? 'done' : ''}`}>
              {plan.activities.length === 0 ? 'No ideas' : `${plan.activities.length} idea${plan.activities.length > 1 ? 's' : ''}`}
            </div>
          </div>
        </div>
      </div>

      {/* Quick view */}
      <div className="section-label">Quick view</div>
      <div className="summary-cards">
        <div className="summary-card" onClick={() => onTabChange('when')}>
          <span className="sc-icon">&#128197;</span>
          <div className="sc-category">Date &amp; Time</div>
          <div className="sc-value">{dateLabel ? `${dateLabel}` : 'Not set yet'}</div>
          <div className="sc-sub">{timeLabel ? `${timeLabel} ✓` : 'Pick a date!'}</div>
        </div>
        <div className="summary-card" onClick={() => onTabChange('where')}>
          <span className="sc-icon">&#128205;</span>
          <div className="sc-category">Location</div>
          <div className="sc-value">{whereDone ? 'Decided!' : 'Still deciding'}</div>
          <div className="sc-sub">{plan.locations.length} option{plan.locations.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="summary-card" onClick={() => onTabChange('what')}>
          <span className="sc-icon">&#10024;</span>
          <div className="sc-category">Activities</div>
          <div className="sc-value">{whatDone} checked</div>
          <div className="sc-sub">{plan.activities.length} total ideas</div>
        </div>
      </div>

      {/* Feed */}
      <div className="section-label">Recent activity</div>
      <div className="feed-section">
        {typingUser && (
          <div className="typing-row">
            <div className="typing-dots">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
            {typingUser} is adding something&hellip;
          </div>
        )}
        {plan.feedItems.map((item, i) => {
          const colors = avatarColors[i % avatarColors.length].split(',')
          const isMe = item.userId === currentUserId
          const label = FEED_ACTION_LABELS[item.action]?.(
            (item.details as Record<string, unknown>) ?? {},
            isMe ? 'You' : item.user.name
          ) ?? item.action
          return (
            <div key={item.id} className="feed-item">
              <div
                className="feed-avatar"
                style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
              >
                {item.user.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div className="feed-text"
                  dangerouslySetInnerHTML={{
                    __html: label.replace(
                      isMe ? 'You' : item.user.name,
                      `<strong>${isMe ? 'You' : item.user.name}</strong>`
                    ),
                  }}
                />
                <div className="feed-time">{timeAgo(item.createdAt)}</div>
              </div>
            </div>
          )
        })}
        {plan.feedItems.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-dim)', padding: '12px 0' }}>
            No activity yet — start planning!
          </div>
        )}
      </div>
      <div className="pad-bottom" />
    </div>
  )
}
