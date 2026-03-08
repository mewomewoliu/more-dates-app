import { ClerkProvider, RedirectToSignIn, useAuth } from '@clerk/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, Component, ReactNode } from 'react'
import { ToastProvider } from './contexts/ToastContext'
import { setAuthToken } from './lib/api'
import MainPage from './pages/MainPage'
import JoinPage from './pages/JoinPage'
import DatePlanPage from './pages/DatePlanPage'
import ProfilePage from './pages/ProfilePage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string
const KEY_IS_CONFIGURED = PUBLISHABLE_KEY &&
  (PUBLISHABLE_KEY.startsWith('pk_test_') || PUBLISHABLE_KEY.startsWith('pk_live_')) &&
  PUBLISHABLE_KEY.length > 20

// ---- Setup screen shown when Clerk key is not yet configured ----
function SetupScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: '#07060A',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      fontFamily: 'DM Sans, sans-serif', padding: 24,
    }}>
      <div style={{ maxWidth: 460, width: '100%' }}>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 42,
          fontWeight: 300, color: '#F0E6D6', lineHeight: 1.08,
          letterSpacing: -1, marginBottom: 8,
        }}>
          Almost<br /><em style={{ fontStyle: 'italic', color: '#E8956D' }}>ready</em>
        </div>
        <div style={{ fontSize: 14, color: '#8A7868', marginBottom: 32, lineHeight: 1.6 }}>
          Add your Clerk publishable key to see the app.
        </div>

        {[
          { step: '1', text: 'Go to clerk.com → create a free app' },
          { step: '2', text: 'Copy your Publishable Key from the dashboard' },
          { step: '3', text: 'Paste it in frontend/.env.local' },
          { step: '4', text: 'Restart the dev server' },
        ].map(({ step, text }) => (
          <div key={step} style={{
            display: 'flex', gap: 14, alignItems: 'flex-start',
            marginBottom: 14,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #E8956D, #C4622D)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'white',
            }}>{step}</div>
            <div style={{ fontSize: 14, color: '#F0E6D6', paddingTop: 4 }}>{text}</div>
          </div>
        ))}

        <div style={{
          background: '#1A120E', border: '1px solid rgba(232,180,130,0.15)',
          borderRadius: 12, padding: '14px 16px', marginTop: 24,
        }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: '#5A4A3C', marginBottom: 6 }}>
            frontend/.env.local
          </div>
          <code style={{ fontSize: 13, color: '#E8956D', fontFamily: 'monospace' }}>
            VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
          </code>
        </div>
      </div>
    </div>
  )
}

// ---- Error boundary for Clerk or render failures ----
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#07060A', color: '#8A7868',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'DM Sans, sans-serif', flexDirection: 'column', gap: 12, padding: 24,
        }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: '#F0E6D6' }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 13, color: '#5A4A3C', maxWidth: 400, textAlign: 'center' }}>
            {(this.state.error as Error).message}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8, background: 'linear-gradient(135deg, #E8956D, #C4622D)',
              border: 'none', borderRadius: 10, padding: '10px 20px',
              color: 'white', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 14,
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function AuthTokenProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth()
  useEffect(() => {
    setAuthToken(getToken)
  }, [getToken])
  return <>{children}</>
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()
  if (!isLoaded) return null
  if (!isSignedIn) return <RedirectToSignIn />
  return <AuthTokenProvider>{children}</AuthTokenProvider>
}

export default function App() {
  if (!KEY_IS_CONFIGURED) return <SetupScreen />

  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <MainPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/plan/:id"
                  element={
                    <ProtectedRoute>
                      <DatePlanPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/join/:token" element={<JoinPage />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </ErrorBoundary>
  )
}
