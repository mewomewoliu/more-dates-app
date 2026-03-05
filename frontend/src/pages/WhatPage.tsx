import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import BottomSheet from '../components/BottomSheet'
import { DatePlan, Activity } from '../types'
import { addActivity, toggleActivity, castVote } from '../lib/api'
import { useToast } from '../contexts/ToastContext'

const CATEGORIES = ['All', '🍽️ Food', '🌿 Outdoors', '🎭 Culture', '🎲 Fun']

const EMOJI_MAP: Record<string, string> = {
  food: '🍽️', outdoors: '🌿', culture: '🎭', fun: '🎲', default: '✨',
}

function ActivityItem({
  activity,
  currentUserId,
  onToggle,
  onHeart,
}: {
  activity: Activity
  currentUserId: string
  onToggle: (id: string, checked: boolean) => void
  onHeart: (id: string, current: 'heart' | null) => void
}) {
  const heartVote = activity.votes.find(v => v.userId === currentUserId && v.value === 'heart')
  const heartCount = activity.votes.filter(v => v.value === 'heart').length

  return (
    <div className={`activity-item ${activity.checked ? '' : 'proposed'}`}>
      <div className="activity-emoji">{activity.emoji}</div>
      <div className="activity-body">
        <div className="activity-name">{activity.name}</div>
        <div className="activity-meta">
          {activity.addedById === currentUserId ? 'Added by you' : `Added by ${activity.addedBy.name.split(' ')[0]}`}
          {' · '}{activity.category}
        </div>
      </div>
      <div className="activity-right">
        <button
          className={`heart-btn ${heartVote ? 'liked' : ''}`}
          onClick={() => onHeart(activity.id, heartVote ? 'heart' : null)}
        >
          {heartVote ? '❤️' : '🤍'} {heartCount}
        </button>
        <div
          className={`check-circle ${activity.checked ? 'checked' : ''}`}
          onClick={() => onToggle(activity.id, !activity.checked)}
        />
      </div>
    </div>
  )
}

interface Props {
  plan: DatePlan
  currentUserId: string
}

export default function WhatPage({ plan, currentUserId }: Props) {
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activityName, setActivityName] = useState('')
  const [activityEmoji, setActivityEmoji] = useState('✨')
  const [activityCategory, setActivityCategory] = useState('fun')
  const [activeCategory, setActiveCategory] = useState('All')

  const addMutation = useMutation({
    mutationFn: () =>
      addActivity(plan.id, {
        name: activityName,
        emoji: activityEmoji,
        category: activityCategory,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', plan.id] })
      setSheetOpen(false)
      setActivityName('')
      setActivityEmoji('✨')
      showToast('✨ Activity added!')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) =>
      toggleActivity(plan.id, id, checked),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plan', plan.id] }),
  })

  const heartMutation = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      castVote(plan.id, { activityId: id, value: 'heart' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plan', plan.id] }),
  })

  const filteredActivities = plan.activities.filter(a => {
    if (activeCategory === 'All') return true
    return activeCategory.toLowerCase().includes(a.category.toLowerCase()) ||
      a.category.toLowerCase().includes(activeCategory.replace(/[^\w]/g, '').toLowerCase())
  })

  return (
    <div className="page active" id="page-what">
      <div className="page-header">
        <div className="page-eyebrow">Step 3</div>
        <div className="page-title">What to<br />do together?</div>
      </div>

      <div className="cat-filter">
        {CATEGORIES.map(cat => (
          <div
            key={cat}
            className={`cat-chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </div>
        ))}
      </div>

      {filteredActivities.map(activity => (
        <ActivityItem
          key={activity.id}
          activity={activity}
          currentUserId={currentUserId}
          onToggle={(id, checked) => toggleMutation.mutate({ id, checked })}
          onHeart={(id) => heartMutation.mutate({ id })}
        />
      ))}

      {filteredActivities.length === 0 && (
        <div style={{ padding: '0 24px', fontSize: 13, color: 'var(--text-dim)' }}>
          No activities yet — add the first one!
        </div>
      )}

      <button className="add-btn" onClick={() => setSheetOpen(true)}>
        + Add an activity
      </button>
      <div className="pad-bottom" />

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Add an activity">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {Object.entries(EMOJI_MAP).map(([cat, emoji]) => (
            <div
              key={cat}
              onClick={() => { setActivityEmoji(emoji); setActivityCategory(cat === 'default' ? 'fun' : cat) }}
              style={{
                padding: '6px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 13,
                background: activityEmoji === emoji ? 'var(--accent-dim)' : 'var(--surface-2)',
                border: `1px solid ${activityEmoji === emoji ? 'var(--accent)' : 'var(--border)'}`,
                color: activityEmoji === emoji ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {emoji} {cat === 'default' ? 'other' : cat}
            </div>
          ))}
        </div>
        <input
          className="input-field"
          placeholder="What do you want to do? *"
          value={activityName}
          onChange={e => setActivityName(e.target.value)}
        />
        <button
          className="btn-primary"
          onClick={() => addMutation.mutate()}
          disabled={!activityName.trim() || addMutation.isPending}
        >
          {addMutation.isPending ? 'Adding...' : 'Add to plan'}
        </button>
      </BottomSheet>
    </div>
  )
}
