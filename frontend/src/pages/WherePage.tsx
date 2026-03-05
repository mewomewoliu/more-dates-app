import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import BottomSheet from '../components/BottomSheet'
import { DatePlan, Location } from '../types'
import { addLocation, castVote } from '../lib/api'
import { useToast } from '../contexts/ToastContext'

const GRADIENT_PRESETS = [
  { from: '#E8956D', to: '#C4622D', emoji: '🍷' },
  { from: '#8BAF9E', to: '#3D7A62', emoji: '🌿' },
  { from: '#C4A882', to: '#8B7355', emoji: '🍜' },
  { from: '#B8A4D8', to: '#7B5EA7', emoji: '🎭' },
  { from: '#F0C060', to: '#C87830', emoji: '☀️' },
]

function LocationCard({
  location,
  currentUserId,
  onVote,
}: {
  location: Location
  currentUserId: string
  onVote: (locationId: string, value: 'yes' | 'no') => void
}) {
  const myVote = location.votes.find(v => v.userId === currentUserId)
  const yesCount = location.votes.filter(v => v.value === 'yes').length

  return (
    <div className="location-card">
      <div className="location-img">
        <div
          className="location-img-bg"
          style={{ background: `linear-gradient(135deg, ${location.gradientFrom}, ${location.gradientTo})` }}
        />
        {location.emoji}
      </div>
      <div className="location-body">
        <div className="location-name">{location.name}</div>
        {location.meta && <div className="location-meta">{location.meta}</div>}
        <div className="location-actions">
          <div className="vote-buttons">
            <button
              className={`vote-btn ${myVote?.value === 'yes' ? 'yes' : ''}`}
              onClick={() => onVote(location.id, 'yes')}
            >
              ❤️ Yes {yesCount > 0 && <span>{yesCount}</span>}
            </button>
            <button
              className={`vote-btn ${myVote?.value === 'no' ? 'no' : ''}`}
              onClick={() => onVote(location.id, 'no')}
            >
              ✕ Pass
            </button>
          </div>
          <div className="added-by">
            <div
              className="added-avatar"
              style={{ background: `linear-gradient(135deg, #E8956D, #C4622D)` }}
            >
              {location.addedBy.name[0].toUpperCase()}
            </div>
            {location.addedById === currentUserId ? 'You' : location.addedBy.name.split(' ')[0]}
          </div>
        </div>
      </div>
    </div>
  )
}

interface Props {
  plan: DatePlan
  currentUserId: string
}

export default function WherePage({ plan, currentUserId }: Props) {
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [name, setName] = useState('')
  const [meta, setMeta] = useState('')
  const [preset, setPreset] = useState(0)

  const addMutation = useMutation({
    mutationFn: () =>
      addLocation(plan.id, {
        name,
        meta,
        emoji: GRADIENT_PRESETS[preset].emoji,
        gradientFrom: GRADIENT_PRESETS[preset].from,
        gradientTo: GRADIENT_PRESETS[preset].to,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', plan.id] })
      setSheetOpen(false)
      setName('')
      setMeta('')
      showToast('📍 Place suggestion added!')
    },
  })

  const voteMutation = useMutation({
    mutationFn: ({ locationId, value }: { locationId: string; value: 'yes' | 'no' }) =>
      castVote(plan.id, { locationId, value }),
    onSuccess: (_, { value }) => {
      qc.invalidateQueries({ queryKey: ['plan', plan.id] })
      showToast(value === 'yes' ? '❤️ Voted yes!' : 'Passed on this one')
    },
  })

  return (
    <div className="page active" id="page-where">
      <div className="page-header">
        <div className="page-eyebrow">Step 2</div>
        <div className="page-title">Where<br />to go?</div>
      </div>

      {plan.locations.map(loc => (
        <LocationCard
          key={loc.id}
          location={loc}
          currentUserId={currentUserId}
          onVote={(locationId, value) => voteMutation.mutate({ locationId, value })}
        />
      ))}

      {plan.locations.length === 0 && (
        <div style={{ padding: '0 24px', fontSize: 13, color: 'var(--text-dim)' }}>
          No places suggested yet — be the first!
        </div>
      )}

      <button className="add-btn" onClick={() => setSheetOpen(true)}>
        + Suggest a place
      </button>
      <div className="pad-bottom" />

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Suggest a place">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {GRADIENT_PRESETS.map((p, i) => (
            <div
              key={i}
              onClick={() => setPreset(i)}
              style={{
                width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
                background: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
                outline: preset === i ? '2px solid var(--accent)' : 'none',
                outlineOffset: 2,
              }}
            >
              {p.emoji}
            </div>
          ))}
        </div>
        <input
          className="input-field"
          placeholder="Place name *"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Neighborhood, vibe, price... (optional)"
          value={meta}
          onChange={e => setMeta(e.target.value)}
        />
        <button
          className="btn-primary"
          onClick={() => addMutation.mutate()}
          disabled={!name.trim() || addMutation.isPending}
        >
          {addMutation.isPending ? 'Adding...' : 'Add suggestion'}
        </button>
      </BottomSheet>
    </div>
  )
}
