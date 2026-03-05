import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth, SignIn } from '@clerk/react'
import { joinPlan } from '../lib/api'

export default function JoinPage() {
  const { token } = useParams<{ token: string }>()
  const { isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !token) return
    joinPlan(token)
      .then(({ planId }: { planId: string }) => navigate(`/plan/${planId}`))
      .catch(() => navigate('/dashboard'))
  }, [isLoaded, isSignedIn, token, navigate])

  if (!isLoaded) return null

  if (!isSignedIn) {
    return (
      <div className="auth-bg">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, color: 'var(--text)', marginBottom: 24 }}>
            Sign in to join<br />the date plan
          </div>
          <SignIn redirectUrl={`/join/${token}`} />
        </div>
      </div>
    )
  }

  return (
    <div className="auth-bg" style={{ color: 'var(--text-muted)', fontSize: 14 }}>
      Joining plan...
    </div>
  )
}
