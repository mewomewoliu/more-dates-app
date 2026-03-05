import { useState } from 'react'
import { useUser } from '@clerk/react'
import PhoneFrame from '../components/PhoneFrame'
import FloatingHearts from '../components/FloatingHearts'
import OngoingDatesPage from './OngoingDatesPage'
import MemoriesPage from './MemoriesPage'
import CreatePlanFlow from './CreatePlanFlow'
import DateDetailPage from './DateDetailPage'
import { MainTab } from '../types'

export default function MainPage() {
  const { user } = useUser()
  const [tab, setTab] = useState<MainTab>('ongoing')
  const [creating, setCreating] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const currentUserId = user?.id ?? ''
  const showTabs = !creating && !selectedPlanId

  function handleTabPress(t: MainTab) {
    if (t === 'create') {
      setCreating(true)
      setSelectedPlanId(null)
    } else {
      setTab(t)
      setSelectedPlanId(null)
      setCreating(false)
    }
  }

  function handleSelectPlan(id: string) {
    setSelectedPlanId(id)
    setCreating(false)
  }

  function handleCreateDone() {
    setCreating(false)
    setTab('ongoing')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07060A', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      <FloatingHearts />
      <PhoneFrame>
        <div className="app">
          {/* Create flow */}
          {creating && (
            <CreatePlanFlow
              onDone={handleCreateDone}
              onCancel={() => setCreating(false)}
            />
          )}

          {/* Detail view */}
          {!creating && selectedPlanId && (
            <DateDetailPage
              planId={selectedPlanId}
              currentUserId={currentUserId}
              onBack={() => setSelectedPlanId(null)}
            />
          )}

          {/* Tab content */}
          {!creating && !selectedPlanId && (
            <>
              {tab === 'ongoing' && (
                <OngoingDatesPage onSelectPlan={handleSelectPlan} />
              )}
              {tab === 'memories' && (
                <MemoriesPage onSelectPlan={handleSelectPlan} />
              )}
            </>
          )}
        </div>

        {/* Tab Bar */}
        {showTabs && (
          <div className="tab-bar">
            <div
              className={`tab ${tab === 'ongoing' ? 'active' : ''}`}
              onClick={() => handleTabPress('ongoing')}
            >
              <div className="tab-icon">🗓</div>
              <div className="tab-label">Ongoing</div>
            </div>

            {/* Centre "+" tab */}
            <div className="tab tab-create" onClick={() => handleTabPress('create')}>
              <div className="tab-create-btn">+</div>
            </div>

            <div
              className={`tab ${tab === 'memories' ? 'active' : ''}`}
              onClick={() => handleTabPress('memories')}
            >
              <div className="tab-icon">🌙</div>
              <div className="tab-label">Memories</div>
            </div>
          </div>
        )}
      </PhoneFrame>
    </div>
  )
}
