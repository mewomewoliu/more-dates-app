import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Calendar from '../components/Calendar'
import DateTips from '../components/DateTips'
import { PlanDraft } from '../types'
import { createCompletePlan } from '../lib/api'
import { useToast } from '../contexts/ToastContext'

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
  { emoji: '🎨', gradientFrom: '#F0C060', gradientTo: '#C87830' },
]

const ACTIVITY_EMOJIS: Record<string, string> = {
  food: '🍽️', outdoors: '🌿', culture: '🎭', fun: '🎲', romantic: '💕', other: '✨',
}

const TOTAL_STEPS = 4

interface Props {
  onDone: () => void
  onCancel: () => void
}

export default function CreatePlanFlow({ onDone, onCancel }: Props) {
  const { showToast } = useToast()
  const qc = useQueryClient()

  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<PlanDraft>({
    title: '',
    date: null,
    timeSlot: '',
    location: null,
    activities: [],
  })

  // Location form state
  const [locName, setLocName] = useState('')
  const [locMeta, setLocMeta] = useState('')
  const [locPreset, setLocPreset] = useState(0)

  // Activity form state
  const [actInput, setActInput] = useState('')
  const [actCategory, setActCategory] = useState('fun')

  const createMutation = useMutation({
    mutationFn: () =>
      createCompletePlan({
        title: draft.title,
        date: draft.date?.toISOString(),
        timeSlot: draft.timeSlot || undefined,
        location: draft.location ?? undefined,
        activities: draft.activities,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ongoing-plans'] })
      showToast('🎉 Date confirmed!')
      onDone()
    },
    onError: () => showToast('Something went wrong, try again'),
  })

  function addActivity() {
    if (!actInput.trim()) return
    setDraft(d => ({
      ...d,
      activities: [
        ...d.activities,
        { name: actInput.trim(), emoji: ACTIVITY_EMOJIS[actCategory] ?? '✨', category: actCategory },
      ],
    }))
    setActInput('')
  }

  function removeActivity(i: number) {
    setDraft(d => ({ ...d, activities: d.activities.filter((_, idx) => idx !== i) }))
  }

  function setLocation() {
    if (!locName.trim()) return
    const preset = LOCATION_PRESETS[locPreset]
    setDraft(d => ({
      ...d,
      location: { name: locName.trim(), meta: locMeta.trim(), ...preset },
    }))
    setLocName('')
    setLocMeta('')
  }

  function canProceed() {
    if (step === 1) return !!draft.date
    return true // Where and What are optional
  }

  return (
    <div className="flow-root">
      {/* Header */}
      <div className="flow-header">
        <button className="flow-back-btn" onClick={step === 1 ? onCancel : () => setStep(s => s - 1)}>
          {step === 1 ? '✕' : '←'}
        </button>
        <div className="flow-step-label">
          {['', 'When?', 'Where?', 'What?', 'Confirm'][step]}
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Step indicator */}
      <div className="step-indicator">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`step-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}`}
          />
        ))}
      </div>

      {/* ---- Step 1: When ---- */}
      {step === 1 && (
        <div className="flow-step">
          <div className="flow-step-hint">Pick a date for your outing</div>
          <Calendar
            selectedDate={draft.date ?? undefined}
            onSelectDate={(date) => setDraft(d => ({ ...d, date }))}
          />
          <div className="section-label" style={{ paddingLeft: 0 }}>What time?</div>
          <div className="time-grid">
            {TIME_SLOTS.map(slot => (
              <div
                key={slot.id}
                className={`time-slot ${draft.timeSlot === slot.id ? 'selected' : ''}`}
                onClick={() => setDraft(d => ({ ...d, timeSlot: d.timeSlot === slot.id ? '' : slot.id }))}
              >
                <div className="time-slot-name">{slot.label}</div>
                <div className="time-slot-range">{slot.range}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Step 2: Where ---- */}
      {step === 2 && (
        <div className="flow-step">
          <div className="flow-step-hint">Where are you going? (optional)</div>

          {draft.location ? (
            <div className="location-card" style={{ margin: '0 0 16px' }}>
              <div className="location-img">
                <div className="location-img-bg" style={{
                  background: `linear-gradient(135deg, ${draft.location.gradientFrom}, ${draft.location.gradientTo})`,
                }} />
                {draft.location.emoji}
              </div>
              <div className="location-body">
                <div className="location-name">{draft.location.name}</div>
                {draft.location.meta && <div className="location-meta">{draft.location.meta}</div>}
                <button
                  className="vote-btn"
                  style={{ marginTop: 8 }}
                  onClick={() => setDraft(d => ({ ...d, location: null }))}
                >
                  ✕ Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="flow-location-form">
              <div className="flow-emoji-row">
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
              <input
                className="input-field"
                placeholder="Place name (e.g. Rooftop Wine Bar)"
                value={locName}
                onChange={e => setLocName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setLocation()}
              />
              <input
                className="input-field"
                placeholder="Vibe, neighborhood, notes… (optional)"
                value={locMeta}
                onChange={e => setLocMeta(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setLocation()}
              />
              <button
                className="btn-secondary"
                onClick={setLocation}
                disabled={!locName.trim()}
              >
                + Add this place
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---- Step 3: What ---- */}
      {step === 3 && (
        <div className="flow-step">
          <div className="flow-step-hint">What will you do? (optional)</div>

          <div className="flow-emoji-row" style={{ marginBottom: 16 }}>
            {Object.entries(ACTIVITY_EMOJIS).map(([cat, emoji]) => (
              <div
                key={cat}
                className={`flow-emoji-chip ${actCategory === cat ? 'active' : ''}`}
                onClick={() => setActCategory(cat)}
                style={{ fontSize: 11, padding: '6px 8px', flexDirection: 'column', gap: 2, height: 48 }}
              >
                <span style={{ fontSize: 16 }}>{emoji}</span>
                <span>{cat}</span>
              </div>
            ))}
          </div>

          <DateTips
            category={actCategory}
            onSelect={(name, emoji, cat) => {
              setDraft(d => ({
                ...d,
                activities: d.activities.some(a => a.name === name)
                  ? d.activities
                  : [...d.activities, { name, emoji, category: cat }],
              }))
            }}
          />

          <div className="flow-act-input-row">
            <input
              className="input-field"
              style={{ marginBottom: 0, flex: 1 }}
              placeholder="Or type your own…"
              value={actInput}
              onChange={e => setActInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addActivity()}
            />
            <button className="flow-add-btn" onClick={addActivity} disabled={!actInput.trim()}>+</button>
          </div>

          <div className="flow-act-list">
            {draft.activities.map((a, i) => (
              <div key={i} className="flow-act-item">
                <span>{a.emoji}</span>
                <span style={{ flex: 1 }}>{a.name}</span>
                <button className="flow-remove-btn" onClick={() => removeActivity(i)}>✕</button>
              </div>
            ))}
            {draft.activities.length === 0 && (
              <div className="flow-empty-hint">Type an activity above and press Enter</div>
            )}
          </div>
        </div>
      )}

      {/* ---- Step 4: Confirm ---- */}
      {step === 4 && (
        <div className="flow-step">
          <div className="flow-step-hint">Name your date & confirm</div>

          <input
            className="input-field"
            placeholder="Give it a name… (e.g. Saturday Night Out)"
            value={draft.title}
            onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
          />

          <div className="review-card">
            <div className="review-row">
              <span className="review-icon">📅</span>
              <div>
                <div className="review-label">When</div>
                <div className="review-value">
                  {draft.date
                    ? draft.date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })
                    : '—'}
                  {draft.timeSlot && ` · ${draft.timeSlot}`}
                </div>
              </div>
            </div>
            <div className="review-row">
              <span className="review-icon">📍</span>
              <div>
                <div className="review-label">Where</div>
                <div className="review-value">
                  {draft.location ? `${draft.location.emoji} ${draft.location.name}` : '—'}
                </div>
              </div>
            </div>
            <div className="review-row">
              <span className="review-icon">✨</span>
              <div>
                <div className="review-label">Activities</div>
                <div className="review-value">
                  {draft.activities.length > 0
                    ? draft.activities.map(a => `${a.emoji} ${a.name}`).join(', ')
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ marginTop: 8 }}
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Saving…' : '🎉 Confirm this date!'}
          </button>
        </div>
      )}

      {/* Bottom navigation */}
      <div className="flow-footer">
        {step < TOTAL_STEPS ? (
          <button
            className="btn-primary"
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
          >
            {step === 1 ? 'Next →' : canProceed() || step > 1 ? 'Next →' : 'Pick a date first'}
          </button>
        ) : null}
        {step > 1 && step < TOTAL_STEPS && (
          <button className="btn-ghost" onClick={() => setStep(s => s + 1)}>
            Skip this step
          </button>
        )}
      </div>
    </div>
  )
}
