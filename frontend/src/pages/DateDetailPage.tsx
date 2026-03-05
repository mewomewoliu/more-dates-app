import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPlan, updatePlan, deletePlan, addLocation, addActivity, deleteLocation, deleteActivity, castVote } from '../lib/api'
import { DatePlan } from '../types'
import Calendar from '../components/Calendar'
import { useToast } from '../contexts/ToastContext'
import BottomSheet from '../components/BottomSheet'

const TIME_SLOTS = [
  { id: 'afternoon', label: '☀️ Afternoon', range: '12pm – 5pm' },
  { id: 'evening',   label: '🌆 Evening',   range: '5pm – 9pm'  },
  { id: 'night',     label: '🌙 Night',      range: '9pm – midnight' },
  { id: 'allday',    label: '🌅 All day',    range: 'Flexible'   },
]

const LOCATION_PRESETS = [
  { emoji: '🍷', gradientFrom: '#E8956D', gradientTo: '#C4622D' },
  { emoji: '🌿', gradientFrom: '#8BAF9E', gradientTo: '#3D7A62' },
  { emoji: '🍜', gradientFrom: '#C4A882', gradientTo: '#8B7355' },
  { emoji: '🎭', gradientFrom: '#B8A4D8', gradientTo: '#7B5EA7' },
  { emoji: '☕', gradientFrom: '#D4A76A', gradientTo: '#8B6340' },
]

const ACTIVITY_EMOJIS: Record<string, string> = {
  food: '🍽️', outdoors: '🌿', culture: '🎭', fun: '🎲', romantic: '💕', other: '✨',
}

interface Props {
  planId: string
  currentUserId: string
  onBack: () => void
}

export default function DateDetailPage({ planId, currentUserId, onBack }: Props) {
  const { showToast } = useToast()
  const qc = useQueryClient()

  const { data: plan, isLoading } = useQuery<DatePlan>({
    queryKey: ['plan', planId],
    queryFn: () => fetchPlan(planId),
  })

  const isPast = plan?.confirmedDate
    ? new Date(plan.confirmedDate) < new Date()
    : false

  const [editingDate, setEditingDate] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const [addLocOpen, setAddLocOpen] = useState(false)
  const [addActOpen, setAddActOpen] = useState(false)

  // Location form
  const [locName, setLocName] = useState('')
  const [locMeta, setLocMeta] = useState('')
  const [locPreset, setLocPreset] = useState(0)

  // Activity form
  const [actInput, setActInput] = useState('')
  const [actCategory, setActCategory] = useState('fun')

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof updatePlan>[1]) => updatePlan(planId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', planId] })
      qc.invalidateQueries({ queryKey: ['ongoing-plans'] })
      showToast('Saved ✓')
      setEditingDate(false)
      setEditingTitle(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deletePlan(planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ongoing-plans'] })
      onBack()
    },
  })

  const addLocMutation = useMutation({
    mutationFn: () =>
      addLocation(planId, {
        name: locName,
        meta: locMeta,
        ...LOCATION_PRESETS[locPreset],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', planId] })
      setAddLocOpen(false)
      setLocName('')
      setLocMeta('')
      showToast('📍 Location added')
    },
  })

  const removeLocMutation = useMutation({
    mutationFn: (locId: string) => deleteLocation(planId, locId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plan', planId] }),
  })

  const addActMutation = useMutation({
    mutationFn: () =>
      addActivity(planId, {
        name: actInput,
        emoji: ACTIVITY_EMOJIS[actCategory] ?? '✨',
        category: actCategory,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', planId] })
      setAddActOpen(false)
      setActInput('')
      showToast('✨ Activity added')
    },
  })

  const removeActMutation = useMutation({
    mutationFn: (actId: string) => deleteActivity(planId, actId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plan', planId] }),
  })

  const voteMutation = useMutation({
    mutationFn: (data: { locationId?: string; activityId?: string; value: 'heart' | 'no' }) =>
      castVote(planId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plan', planId] }),
  })

  function toggleHeart(type: 'location' | 'activity', id: string) {
    const items = type === 'location' ? plan?.locations : plan?.activities
    const item = items?.find((x: { id: string }) => x.id === id)
    const myVote = item?.votes?.find((v: { userId: string; value: string }) => v.userId === currentUserId)
    const newValue = myVote?.value === 'heart' ? 'no' : 'heart'
    if (type === 'location') voteMutation.mutate({ locationId: id, value: newValue })
    else voteMutation.mutate({ activityId: id, value: newValue })
  }

  function copyShare() {
    if (!plan) return
    navigator.clipboard.writeText(`${window.location.origin}/join/${plan.shareToken}`).catch(() => {})
    showToast('Link copied!')
    setShareOpen(false)
  }

  if (isLoading || !plan) {
    return (
      <div className="detail-root">
        <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: 24 }}>Loading…</div>
      </div>
    )
  }

  const confirmedLocation = plan.confirmedLocationId
    ? plan.locations.find(l => l.id === plan.confirmedLocationId) ?? plan.locations[0]
    : plan.locations[0]

  const dateLabel = plan.confirmedDate
    ? new Date(plan.confirmedDate).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      })
    : null

  const daysUntil = plan.confirmedDate && !isPast
    ? Math.ceil((new Date(plan.confirmedDate).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="detail-root">
      {/* Back + actions */}
      <div className="detail-topbar">
        <button className="flow-back-btn" onClick={onBack}>←</button>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isPast && (
            <button className="share-header-btn" style={{ position: 'static' }} onClick={() => setShareOpen(true)}>
              🔗 Share
            </button>
          )}
        </div>
      </div>

      {/* Hero */}
      <div className="detail-hero" style={{
        background: confirmedLocation
          ? `linear-gradient(160deg, ${confirmedLocation.gradientFrom}22, var(--bg) 60%)`
          : 'linear-gradient(160deg, #E8956D22, var(--bg) 60%)',
      }}>
        {editingTitle ? (
          <input
            className="input-field"
            style={{ fontSize: 24, fontFamily: 'Cormorant Garamond, serif', fontWeight: 300 }}
            value={titleInput}
            onChange={e => setTitleInput(e.target.value)}
            onBlur={() => {
              if (titleInput.trim()) updateMutation.mutate({ title: titleInput.trim() })
              else setEditingTitle(false)
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && titleInput.trim()) updateMutation.mutate({ title: titleInput.trim() })
            }}
            autoFocus
          />
        ) : (
          <div
            className="date-title"
            style={{ marginBottom: 8, cursor: isPast ? 'default' : 'pointer' }}
            onClick={() => {
              if (!isPast) { setTitleInput(plan.title); setEditingTitle(true) }
            }}
          >
            {plan.title}
            {!isPast && <span style={{ fontSize: 14, color: 'var(--text-dim)', marginLeft: 8 }}>✎</span>}
          </div>
        )}
        {isPast ? (
          <div className="memory-badge" style={{ alignSelf: 'flex-start' }}>Memory</div>
        ) : daysUntil !== null ? (
          <div className="live-badge" style={{ alignSelf: 'flex-start' }}>
            {daysUntil === 0 ? '🎉 Today!' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
          </div>
        ) : null}
      </div>

      {/* ---- When ---- */}
      <div className="detail-section">
        <div className="detail-section-header">
          <div className="detail-section-title">📅 When</div>
          {!isPast && (
            <button className="detail-edit-btn" onClick={() => setEditingDate(d => !d)}>
              {editingDate ? 'Done' : 'Edit'}
            </button>
          )}
        </div>
        {editingDate ? (
          <>
            <Calendar
              selectedDate={plan.confirmedDate ? new Date(plan.confirmedDate) : undefined}
              onSelectDate={(date) => updateMutation.mutate({ confirmedDate: date.toISOString() })}
            />
            <div className="time-grid" style={{ padding: '0 0 12px' }}>
              {TIME_SLOTS.map(slot => (
                <div
                  key={slot.id}
                  className={`time-slot ${plan.confirmedTimeSlot === slot.id ? 'selected' : ''}`}
                  onClick={() => updateMutation.mutate({ confirmedTimeSlot: slot.id })}
                >
                  <div className="time-slot-name">{slot.label}</div>
                  <div className="time-slot-range">{slot.range}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="detail-value">
            {dateLabel ?? <span style={{ color: 'var(--text-dim)' }}>Not set</span>}
            {plan.confirmedTimeSlot && (
              <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                · {TIME_SLOTS.find(s => s.id === plan.confirmedTimeSlot)?.label}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ---- Where ---- */}
      <div className="detail-section">
        <div className="detail-section-header">
          <div className="detail-section-title">📍 Where</div>
          {!isPast && (
            <button className="detail-edit-btn" onClick={() => setAddLocOpen(true)}>+ Add</button>
          )}
        </div>
        {plan.locations.length === 0 ? (
          <div className="detail-empty">No location added</div>
        ) : (
          plan.locations.map(loc => {
            const heartCount = loc.votes?.filter((v: { value: string }) => v.value === 'heart').length ?? 0
            const myHeart = loc.votes?.some((v: { userId: string; value: string }) => v.userId === currentUserId && v.value === 'heart')
            return (
              <div key={loc.id} className="detail-loc-row">
                <div
                  className="detail-loc-dot"
                  style={{ background: `linear-gradient(135deg, ${loc.gradientFrom}, ${loc.gradientTo})` }}
                >
                  {loc.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{loc.name}</div>
                  {loc.meta && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{loc.meta}</div>}
                </div>
                <button
                  className={`heart-vote-btn ${myHeart ? 'hearted' : ''}`}
                  onClick={() => toggleHeart('location', loc.id)}
                >
                  {myHeart ? '♥' : '♡'}
                  {heartCount > 0 && <span className="heart-count">{heartCount}</span>}
                </button>
                {!isPast && (
                  <button
                    className="flow-remove-btn"
                    onClick={() => removeLocMutation.mutate(loc.id)}
                  >✕</button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ---- What ---- */}
      <div className="detail-section">
        <div className="detail-section-header">
          <div className="detail-section-title">✨ Activities</div>
          {!isPast && (
            <button className="detail-edit-btn" onClick={() => setAddActOpen(true)}>+ Add</button>
          )}
        </div>
        {plan.activities.length === 0 ? (
          <div className="detail-empty">No activities added</div>
        ) : (
          <div className="flow-act-list" style={{ padding: 0 }}>
            {plan.activities.map(act => {
              const heartCount = act.votes?.filter((v: { value: string }) => v.value === 'heart').length ?? 0
              const myHeart = act.votes?.some((v: { userId: string; value: string }) => v.userId === currentUserId && v.value === 'heart')
              return (
                <div key={act.id} className="flow-act-item">
                  <span>{act.emoji}</span>
                  <span style={{ flex: 1 }}>{act.name}</span>
                  <button
                    className={`heart-vote-btn ${myHeart ? 'hearted' : ''}`}
                    onClick={() => toggleHeart('activity', act.id)}
                  >
                    {myHeart ? '♥' : '♡'}
                    {heartCount > 0 && <span className="heart-count">{heartCount}</span>}
                  </button>
                  {!isPast && (
                    <button
                      className="flow-remove-btn"
                      onClick={() => removeActMutation.mutate(act.id)}
                    >✕</button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete (only owner, not past) */}
      {!isPast && plan.createdById === currentUserId && (
        <div style={{ padding: '0 24px 32px' }}>
          <button
            className="btn-ghost"
            style={{ color: '#C85050', borderColor: 'rgba(200,80,80,0.3)' }}
            onClick={() => {
              if (confirm('Delete this date plan?')) deleteMutation.mutate()
            }}
          >
            Delete plan
          </button>
        </div>
      )}

      {/* Share sheet */}
      <BottomSheet open={shareOpen} onClose={() => setShareOpen(false)} title="Invite your partner">
        <div className="share-link-box">
          <div className="share-link-url">
            {window.location.origin}/join/{plan.shareToken}
          </div>
          <button className="copy-btn" onClick={copyShare}>Copy</button>
        </div>
        <div className="share-note">Anyone with the link can view &amp; co-edit this plan</div>
      </BottomSheet>

      {/* Add location sheet */}
      <BottomSheet open={addLocOpen} onClose={() => setAddLocOpen(false)} title="Add a place">
        <div className="flow-emoji-row" style={{ marginBottom: 12 }}>
          {LOCATION_PRESETS.map((p, i) => (
            <div
              key={i}
              className={`flow-emoji-chip ${locPreset === i ? 'active' : ''}`}
              onClick={() => setLocPreset(i)}
            >
              {p.emoji}
            </div>
          ))}
        </div>
        <input className="input-field" placeholder="Place name *" value={locName} onChange={e => setLocName(e.target.value)} />
        <input className="input-field" placeholder="Vibe, notes… (optional)" value={locMeta} onChange={e => setLocMeta(e.target.value)} />
        <button className="btn-primary" onClick={() => addLocMutation.mutate()} disabled={!locName.trim() || addLocMutation.isPending}>
          {addLocMutation.isPending ? 'Adding…' : 'Add location'}
        </button>
      </BottomSheet>

      {/* Add activity sheet */}
      <BottomSheet open={addActOpen} onClose={() => setAddActOpen(false)} title="Add an activity">
        <div className="flow-emoji-row" style={{ marginBottom: 12 }}>
          {Object.entries(ACTIVITY_EMOJIS).map(([cat, emoji]) => (
            <div
              key={cat}
              className={`flow-emoji-chip ${actCategory === cat ? 'active' : ''}`}
              onClick={() => setActCategory(cat)}
            >
              {emoji}
            </div>
          ))}
        </div>
        <input className="input-field" placeholder="Activity name *" value={actInput} onChange={e => setActInput(e.target.value)} />
        <button className="btn-primary" onClick={() => addActMutation.mutate()} disabled={!actInput.trim() || addActMutation.isPending}>
          {addActMutation.isPending ? 'Adding…' : 'Add activity'}
        </button>
      </BottomSheet>
    </div>
  )
}
