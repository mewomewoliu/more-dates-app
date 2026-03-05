import { useState } from 'react'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa']

interface CalendarProps {
  selectedDate?: Date
  partnerVoteDates?: Date[]
  onSelectDate: (date: Date) => void
}

export default function Calendar({ selectedDate, partnerVoteDates = [], onSelectDate }: CalendarProps) {
  const now = new Date()
  const [year, setYear] = useState(selectedDate?.getFullYear() ?? now.getFullYear())
  const [month, setMonth] = useState(selectedDate?.getMonth() ?? now.getMonth())

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const partnerDays = new Set(
    partnerVoteDates
      .filter(d => d.getFullYear() === year && d.getMonth() === month)
      .map(d => d.getDate())
  )

  return (
    <div className="calendar-wrap">
      <div className="cal-nav">
        <button className="cal-btn" onClick={prevMonth}>&#8249;</button>
        <div className="cal-month">{MONTHS[month]} {year}</div>
        <button className="cal-btn" onClick={nextMonth}>&#8250;</button>
      </div>

      <div className="cal-grid">
        {DAY_LABELS.map(d => (
          <div key={d} className="cal-day-label">{d}</div>
        ))}

        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="cal-day empty" />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const thisDate = new Date(year, month, day)
          const isPast = thisDate < todayDate
          const isToday = thisDate.getTime() === todayDate.getTime()
          const isSelected =
            selectedDate &&
            selectedDate.getFullYear() === year &&
            selectedDate.getMonth() === month &&
            selectedDate.getDate() === day
          const isPartner = partnerDays.has(day) && !isSelected

          let cls = 'cal-day'
          if (isPast) cls += ' past'
          else if (isSelected) cls += ' selected'
          else if (isToday) cls += ' today'
          else if (isPartner) cls += ' partner-vote'

          return (
            <div
              key={day}
              className={cls}
              onClick={() => !isPast && onSelectDate(new Date(year, month, day))}
            >
              {day}
            </div>
          )
        })}
      </div>

      <div className="cal-legend">
        <div className="legend-item">
          <div className="legend-dot legend-dot-you" />
          Your pick
        </div>
        <div className="legend-item">
          <div className="legend-dot legend-dot-partner" />
          Partner's votes
        </div>
      </div>
    </div>
  )
}
