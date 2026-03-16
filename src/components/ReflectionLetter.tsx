import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { API_URL } from '../api'

export default function ReflectionLetter() {
  const pending = useStore((s) => s.state?.reflection_letter_pending)
  const [letter, setLetter] = useState<{ subject: string; body: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [acknowledging, setAcknowledging] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)

  // Fetch letter when pending becomes true
  useEffect(() => {
    if (!pending) {
      setLetter(null)
      setFadeIn(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`${API_URL}/api/reflection/latest`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (!cancelled) {
          setLetter({ subject: data.subject || '', body: data.letter || data.body || data.content || '' })
          setLoading(false)
          // Trigger fade-in after mount
          requestAnimationFrame(() => setFadeIn(true))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLetter({ subject: '', body: 'The letter is unreadable... the ink has faded.' })
          setLoading(false)
          requestAnimationFrame(() => setFadeIn(true))
        }
      })
    return () => { cancelled = true }
  }, [pending])

  // Escape key to dismiss — use ref to avoid stale closure
  const handleAcknowledgeRef = useRef(handleAcknowledge)
  handleAcknowledgeRef.current = handleAcknowledge
  useEffect(() => {
    if (!pending) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleAcknowledgeRef.current() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [pending])

  if (!pending) return null

  async function handleAcknowledge() {
    setAcknowledging(true)
    try {
      const res = await fetch(`${API_URL}/api/reflection/acknowledge`, { method: 'POST' })
      if (!res.ok) throw new Error(`${res.status}`)
    } catch {}
    // Clear local state as fallback (don't wait for WebSocket)
    const currentState = useStore.getState().state
    if (currentState) {
      useStore.getState().setState({ ...currentState, reflection_letter_pending: false })
    }
    setAcknowledging(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: fadeIn ? 'rgba(0, 0, 0, 0.98)' : 'rgba(0, 0, 0, 0)',
        transition: 'background 0.6s ease',
      }}
    >
      {/* Parchment card */}
      <div
        style={{
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(170deg, #f4e4c1 0%, #e8d5a8 30%, #dcc89a 60%, #d4bc88 100%)',
          border: '3px solid #8b6914',
          borderRadius: '4px',
          boxShadow: fadeIn
            ? '0 0 60px rgba(180, 140, 60, 0.3), 0 12px 40px rgba(0, 0, 0, 0.6), inset 0 0 30px rgba(139, 105, 20, 0.15)'
            : '0 0 0px transparent',
          padding: '32px 28px 24px',
          position: 'relative',
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          // Aged paper texture effect
          backgroundImage: `
            radial-gradient(ellipse at 20% 50%, rgba(139, 105, 20, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(120, 80, 10, 0.06) 0%, transparent 50%)
          `,
        }}
      >
        {/* Wax seal decoration */}
        <div style={{
          position: 'absolute',
          top: '-14px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 35%, #c0392b, #8b1a1a)',
          border: '2px solid #6b1010',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, serif',
          fontSize: '14px',
          color: '#f4e4c1',
          fontWeight: 'bold',
        }}>
          H
        </div>

        {/* Title */}
        <div style={{
          textAlign: 'center',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '18px',
          color: '#4a3520',
          fontWeight: 'bold',
          letterSpacing: '1px',
          marginBottom: '4px',
          textShadow: '0 1px 0 rgba(255, 255, 255, 0.3)',
        }}>
          A Letter from Hermes
        </div>

        {/* Decorative divider */}
        <div style={{
          textAlign: 'center',
          color: '#8b6914',
          fontSize: '10px',
          marginBottom: '16px',
          letterSpacing: '4px',
          opacity: 0.6,
        }}>
          --- --- ---
        </div>

        {/* Letter body — scrollable */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          marginBottom: '20px',
          minHeight: '100px',
        }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: '14px',
              color: '#7a6540',
              marginTop: '30px',
            }}>
              Unfolding the parchment...
            </div>
          ) : (
            <div style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontSize: '14px',
              lineHeight: '1.8',
              color: '#3a2a18',
              whiteSpace: 'pre-wrap',
              textShadow: '0 0.5px 0 rgba(255, 255, 255, 0.2)',
            }}>
              {letter?.body || ''}
            </div>
          )}
        </div>

        {/* Acknowledge button */}
        {!loading && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleAcknowledge}
              disabled={acknowledging}
              style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: '8px',
                padding: '10px 24px',
                cursor: acknowledging ? 'wait' : 'pointer',
                background: acknowledging
                  ? 'rgba(90, 60, 20, 0.4)'
                  : 'linear-gradient(180deg, #6a4428 0%, #4a2a14 50%, #3a2210 100%)',
                border: '2px solid #8b6914',
                color: '#f0e68c',
                letterSpacing: '1px',
                boxShadow: acknowledging
                  ? 'none'
                  : '0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 220, 140, 0.15)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!acknowledging) {
                  e.currentTarget.style.borderColor = '#f0e68c'
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(240, 230, 140, 0.3), inset 0 1px 0 rgba(255, 220, 140, 0.2)'
                }
              }}
              onMouseLeave={(e) => {
                if (!acknowledging) {
                  e.currentTarget.style.borderColor = '#8b6914'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 220, 140, 0.15)'
                }
              }}
            >
              {acknowledging ? 'REFLECTING...' : "I'VE READ IT"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
