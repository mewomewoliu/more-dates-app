import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/react'
import { fetchPlans, createPlan } from '../lib/api'
import { DatePlan } from '../types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useUser()
  const { signOut } = useClerk()
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')

  const { data: plans = [], isLoading } = useQuery<DatePlan[]>({
    queryKey: ['plans'],
    queryFn: fetchPlans,
  })

  const createMutation = useMutation({
    mutationFn: (t: string) => createPlan({ title: t }),
    onSuccess: (plan: DatePlan) => {
      qc.invalidateQueries({ queryKey: ['plans'] })
      navigate(`/plan/${plan.id}`)
    },
  })

  function handleCreate() {
    if (!title.trim()) return
    createMutation.mutate(title.trim())
  }

  return (
    <div className="dashboard-bg">
      <div className="dashboard-inner">
        <div className="dashboard-header">
          <div>
            <div className="app-eyebrow" style={{ marginBottom: 6 }}>Your plans</div>
            <div className="dashboard-title">
              Plan your<br /><em>perfect</em> date
            </div>
          </div>
          <div
            className="dashboard-user"
            onClick={() => signOut(() => navigate('/'))}
            title="Sign out"
          >
            <div
              className="avatar avatar-a"
              style={{ width: 32, height: 32, fontSize: 12, border: 'none' }}
            >
              {user?.firstName?.[0] ?? user?.emailAddresses[0].emailAddress[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sign out</span>
          </div>
        </div>

        {isLoading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</div>
        ) : plans.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">💕</span>
            No plans yet.<br />Create your first date plan below.
          </div>
        ) : (
          <div className="plan-list">
            {plans.map(plan => (
              <div
                key={plan.id}
                className="plan-card"
                onClick={() => navigate(`/plan/${plan.id}`)}
              >
                <div className="plan-card-title">{plan.title}</div>
                <div className="plan-card-meta">
                  <span>
                    {plan.members.length} planner{plan.members.length > 1 ? 's' : ''}
                  </span>
                  <span>{timeAgo(plan.updatedAt)}</span>
                  {plan.occasion && <span>{plan.occasion}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {creating ? (
          <div style={{ marginTop: 20 }}>
            <input
              className="input-field"
              placeholder="Give your date a name..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-primary"
                onClick={handleCreate}
                disabled={!title.trim() || createMutation.isPending}
                style={{ flex: 1 }}
              >
                {createMutation.isPending ? 'Creating...' : 'Create plan'}
              </button>
              <button
                onClick={() => { setCreating(false); setTitle('') }}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '16px 20px',
                  color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button className="create-plan-btn" onClick={() => setCreating(true)}>
            + New date plan
          </button>
        )}
      </div>
    </div>
  )
}
