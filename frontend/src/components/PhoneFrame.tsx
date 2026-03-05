import { ReactNode } from 'react'

export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="phone">
      {/* Status Bar */}
      <div className="status-bar">
        <span className="status-time">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div className="status-icons">
          <svg width="17" height="12" viewBox="0 0 17 12" opacity="0.9">
            <rect x="0" y="4" width="3" height="8" rx="1" opacity="0.35"/>
            <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" opacity="0.6"/>
            <rect x="9" y="0.5" width="3" height="11.5" rx="1"/>
            <rect x="13.5" y="0" width="3" height="12" rx="1"/>
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" opacity="0.9">
            <path d="M8 3C9.7 3 11.2 3.7 12.3 4.8L13.7 3.4C12.2 1.9 10.2 1 8 1C5.8 1 3.8 1.9 2.3 3.4L3.7 4.8C4.8 3.7 6.3 3 8 3Z" opacity="0.4"/>
            <path d="M8 6C9.1 6 10 6.4 10.6 7.1L12 5.7C11 4.7 9.6 4 8 4C6.4 4 5 4.7 4 5.7L5.4 7.1C6 6.4 6.9 6 8 6Z"/>
            <circle cx="8" cy="10" r="1.5"/>
          </svg>
          <svg width="26" height="12" viewBox="0 0 26 12" opacity="0.9">
            <rect x="0.5" y="0.5" width="22" height="11" rx="3.5" stroke="white" strokeWidth="1" fill="none" opacity="0.4"/>
            <rect x="23" y="3.5" width="2.5" height="5" rx="1.5" fill="white" opacity="0.4"/>
            <rect x="2" y="2" width="17" height="8" rx="2" fill="white"/>
          </svg>
        </div>
      </div>
      {children}
    </div>
  )
}
