import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#0d0a06',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-pixel)',
        zIndex: 99999,
      }}>
        <div style={{
          fontSize: '16px',
          letterSpacing: '4px',
          color: '#e04040',
          marginBottom: '12px',
          textShadow: '0 0 12px rgba(224,64,64,0.5)',
        }}>
          A RIFT IN REALITY
        </div>
        <div style={{
          fontSize: '6px',
          color: '#8b7355',
          marginBottom: '24px',
          letterSpacing: '2px',
          maxWidth: '320px',
          textAlign: 'center',
        }}>
          The fabric of the world has torn. An unknown force disrupts your adventure.
        </div>
        <div style={{
          fontSize: '5px',
          color: '#5c4a2a',
          marginBottom: '24px',
          maxWidth: '400px',
          textAlign: 'center',
          wordBreak: 'break-word',
          lineHeight: 1.6,
          padding: '8px 12px',
          background: 'rgba(30,20,10,0.6)',
          border: '1px solid #3a2210',
          borderRadius: '4px',
        }}>
          {this.state.error?.message || 'Unknown error'}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '8px',
            letterSpacing: '3px',
            color: '#f0e68c',
            background: 'linear-gradient(180deg, #3a2210, #1a140c)',
            border: '2px solid #5c3a1e',
            borderRadius: '4px',
            padding: '8px 24px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#f0e68c'
            e.currentTarget.style.boxShadow = '0 0 8px rgba(240,230,140,0.3)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#5c3a1e'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          RELOAD
        </button>
      </div>
    )
  }
}
