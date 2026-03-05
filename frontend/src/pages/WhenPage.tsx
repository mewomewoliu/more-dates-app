import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Calendar from '../components/Calendar'
import { DatePlan } from '../types'
import { addWhenOption, castVote } from '../lib/api'
import { useToast } from '../contexts/ToastContext'

const TIME_SLOTS = [
  { id: 'afternoon', label: '☀️ Afternoon', range: '12pm – 5pm' },
  { id: 'evening',   label: '🌆 Evening',   range: '5pm – 9pm'   },
  { id: 'night',     label: '🌙 Night',      range: '9pm – midnight' },
  { id: 'allday',    label: '🌅 All day',    range: 'Flexible'    },
]

interface Props {
  plan: DatePlan
  currentUserId: string
}

export default function WhenPage({ plan, currentUserId }: Props) {
  const { showToast } = useToast()
  const qc = useQueryClient()

  const selectedDateOption = plan.whenOptions.find(o => o.date)
  const selectedDate = selectedDateOption?.date ? new Date(selectedDateOption.date) : undefined

  const partnerVoteDates = plan.whenOptions
    .filter(o => o.date && o.votes.some(v => v.userId !== currentUserId))
    .map(o => new Date(o.date!))

  const selectedTimeSlot = plan.whenOptions.find(
    o => o.timeSlot && o.votes.some(v => v.userId === currentUserId)
  )?.timeSlot

  const addDateMutation = useMutation({
    mutationFn: (date: Date) =>
      addWhenOption(plan.id, { date: date.toISOString() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', plan.id] })
      showToast('Date saved ✓')
    },
  })

  const voteTimeMutation = useMutation({
    mutationFn: async (timeSlot: string) => {
      // Find or create the when option for this time slot
      let option = plan.whenOptions.find(o => o.timeSlot === timeSlot)
      if (!option) {
        option = await addWhenOption(plan.id, { timeSlot })
      }
      return castVote(plan.id, { whenOptionId: option.id, value: 'yes' })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', plan.id] })
      showToast('Time preference saved')
    },
  })

  return (
    <div className="page active" id="page-when">
      <div className="page-header">
        <div className="page-eyebrow">Step 1</div>
        <div className="page-title">When are<br />you free?</div>
      </div>

      <Calendar
        selectedDate={selectedDate}
        partnerVoteDates={partnerVoteDates}
        onSelectDate={(date) => addDateMutation.mutate(date)}
      />

      <div className="time-section">
        <div className="section-label">What time?</div>
        <div className="time-grid">
          {TIME_SLOTS.map(slot => {
            const option = plan.whenOptions.find(o => o.timeSlot === slot.id)
            const votes = option?.votes.length ?? 0
            const isSelected = selectedTimeSlot === slot.id ||
              option?.votes.some(v => v.userId === currentUserId)
            return (
              <div
                key={slot.id}
                className={`time-slot ${isSelected ? 'selected' : ''}`}
                onClick={() => voteTimeMutation.mutate(slot.id)}
              >
                <div className="time-slot-name">{slot.label}</div>
                <div className="time-slot-range">{slot.range}</div>
                <div className="time-slot-votes">{votes > 0 ? `${votes} vote${votes > 1 ? 's' : ''}` : ''}</div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="pad-bottom" />
    </div>
  )
}
