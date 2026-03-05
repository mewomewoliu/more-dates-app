import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useUser, useAuth } from '@clerk/react'
import PhoneFrame from '../components/PhoneFrame'
import BottomSheet from '../components/BottomSheet'
import OverviewPage from './OverviewPage'
import WhenPage from './WhenPage'
import WherePage from './WherePage'
import WhatPage from './WhatPage'
import { fetchPlan } from '../lib/api'
import { getSocket } from '../lib/socket'
import { TabName, DatePlan } from '../types'
import { useToast } from '../contexts/ToastContext'

const TABS: { id: TabName; icon: string; label: string }[] = [
  { id: 'overview', icon: '🗓', label: 'Plan'  },
  { id: 'when',     icon: '⏰', label: 'When'  },
  { id: 'where',    icon: '📍', label: 'Where' },
  { id: 'what',     icon: '✨', label: 'What'  },
]

export default function DatePlanPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const { getToken } = useAuth()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState<TabName>('overview')
  const [shareOpen, setShareOpen] = useState(false)
  const [tabNotifs, setTabNotifs] = useState<Set<TabName>>(new Set(['where']))
  const [typingUser, setTypingUser] = useState<string | null>(null)

  const { data: plan, isLoading, error } = useQuery<DatePlan>({
    queryKey: ['plan', id],
    queryFn: () => fetchPlan(id!),
    enabled: !!id,
    refetchInterval: 10_000,
  })

  // Socket.io real-time
  useEffect(() => {
    if (!id || !user) return
    let sock: ReturnType<typeof getSocket>

    getToken().then(token => {
      if (!token) return
      sock = getSocket(token, user.id)
      sock.emit('join_plan', id)

      sock.on('plan_updated', () => {
        // Trigger a refetch by invalidating — handled via react-query
        window.dispatchEvent(new CustomEvent('plan-updated', { detail: id }))
      })

      sock.on('typing', ({ userName }: { userName: string }) => {
        setTypingUser(userName)
        setTimeout(() => setTypingUser(null), 3000)
      })
    })

    return () => {
      sock?.emit('leave_plan', id)
    }
  }, [id, user, getToken])

  function switchTab(tab: TabName) {
    setActiveTab(tab)
    setTabNotifs(prev => { const s = new Set(prev); s.delete(tab); return s })
  }

  function copyShareLink() {
    if (!plan) return
    const url = `${window.location.origin}/join/${plan.shareToken}`
    navigator.clipboard.writeText(url).catch(() => {})
    showToast('Link copied to clipboard')
    setShareOpen(false)
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#07060A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PhoneFrame>
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Loading...
          </div>
        </PhoneFrame>
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div style={{ minHeight: '100vh', background: '#07060A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PhoneFrame>
          <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>
            Plan not found. <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>Go back</span>
          </div>
        </PhoneFrame>
      </div>
    )
  }

  const currentUserId = user?.id ?? ''
  const shareUrl = `${window.location.origin}/join/${plan.shareToken}`

  return (
    <div style={{ minHeight: '100vh', background: '#07060A', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <PhoneFrame>
        <div className="app">
          {/* Pages */}
          <div style={{ display: activeTab === 'overview' ? 'block' : 'none', height: '100%' }}>
            <OverviewPage
              plan={plan}
              currentUserId={currentUserId}
              onTabChange={switchTab}
              onShareOpen={() => setShareOpen(true)}
              typingUser={typingUser}
            />
          </div>
          <div style={{ display: activeTab === 'when' ? 'block' : 'none', height: '100%' }}>
            <WhenPage plan={plan} currentUserId={currentUserId} />
          </div>
          <div style={{ display: activeTab === 'where' ? 'block' : 'none', height: '100%' }}>
            <WherePage plan={plan} currentUserId={currentUserId} />
          </div>
          <div style={{ display: activeTab === 'what' ? 'block' : 'none', height: '100%' }}>
            <WhatPage plan={plan} currentUserId={currentUserId} />
          </div>
        </div>

        {/* Tab Bar */}
        <div className="tab-bar">
          {TABS.map(tab => (
            <div
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''} ${tabNotifs.has(tab.id) ? 'has-notif' : ''}`}
              onClick={() => switchTab(tab.id)}
            >
              <div className="tab-notif" />
              <div className="tab-icon">{tab.icon}</div>
              <div className="tab-label">{tab.label}</div>
            </div>
          ))}
        </div>

        {/* Share Sheet */}
        <BottomSheet open={shareOpen} onClose={() => setShareOpen(false)} title="Invite your partner">
          <div className="share-link-box">
            <div className="share-link-url">{shareUrl}</div>
            <button className="copy-btn" onClick={copyShareLink}>Copy</button>
          </div>
          <div className="share-options">
            {[
              { icon: '💬', name: 'Message'  },
              { icon: '📧', name: 'Email'    },
              { icon: '📱', name: 'WhatsApp' },
              { icon: '📋', name: 'Copy link' },
            ].map(opt => (
              <div key={opt.name} className="share-opt" onClick={copyShareLink}>
                <span className="share-opt-icon">{opt.icon}</span>
                <span className="share-opt-name">{opt.name}</span>
              </div>
            ))}
          </div>
          <div className="share-note">Anyone with the link can view &amp; co-edit this plan</div>
        </BottomSheet>
      </PhoneFrame>
    </div>
  )
}
