import { useEffect } from 'react'
import { DatePlan } from '../types'

interface Props {
  plans: DatePlan[]
  onSelectPlan: (id: string) => void
}

function getDaysUntil(dateStr: string) {
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((date.getTime() - today.getTime()) / 86400000)
}

export default function ReminderBanner({ plans, onSelectPlan }: Props) {
  const todayPlan = plans.find(p => p.confirmedDate && getDaysUntil(p.confirmedDate) === 0)
  const tomorrowPlan = !todayPlan && plans.find(p => p.confirmedDate && getDaysUntil(p.confirmedDate) === 1)
  const soonPlan = !todayPlan && !tomorrowPlan && plans.find(p => {
    const d = p.confirmedDate ? getDaysUntil(p.confirmedDate) : null
    return d !== null && d > 1 && d <= 3
  })

  const plan = todayPlan || tomorrowPlan || soonPlan
  const days = plan?.confirmedDate ? getDaysUntil(plan.confirmedDate) : null

  // Browser notification for today's date
  useEffect(() => {
    if (!todayPlan) return
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      new Notification('Your date is today! 💕', {
        body: `${todayPlan.title} — enjoy every moment`,
        icon: '/favicon.ico',
      })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          new Notification('Your date is today! 💕', {
            body: `${todayPlan.title} — enjoy every moment`,
            icon: '/favicon.ico',
          })
        }
      })
    }
  }, [todayPlan?.id])

  if (!plan) return null

  const message = days === 0
    ? `Your date is today! 🎉`
    : days === 1
    ? `Date tomorrow — get excited!`
    : `Date in ${days} days`

  return (
    <div
      className={`reminder-banner ${days === 0 ? 'reminder-today' : ''}`}
      onClick={() => onSelectPlan(plan.id)}
    >
      <div className="reminder-pulse" />
      <div className="reminder-content">
        <div className="reminder-title">{plan.title}</div>
        <div className="reminder-msg">{message}</div>
      </div>
      <div className="reminder-arrow">→</div>
    </div>
  )
}
