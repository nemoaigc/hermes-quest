import { useState, useEffect, useRef } from 'react'
import { API_URL } from '../api'

interface TavernMessage {
  npc: string
  name: string
  text: string
}

const NPC_STYLE: Record<string, { color: string; mark: string }> = {
  lyra:   { color: '#f0e68c', mark: '*' },
  aldric: { color: '#4ecdc4', mark: '+' },
  kael:   { color: '#ff6b6b', mark: '#' },
  gus:    { color: '#ff9944', mark: '~' },
  orin:   { color: '#a855f7', mark: '>' },
}

export default function TavernAmbientChat({ onRumorsClick, rumorsLoading }: {
  onRumorsClick?: () => void
  rumorsLoading?: boolean
}) {
  const [messages, setMessages] = useState<TavernMessage[]>([])
  const [visibleCount, setVisibleCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/tavern/ambient`)
      .then(r => r.ok ? r.json() : { messages: [] })
      .then(d => {
        if (d.messages?.length > 0) {
          setMessages(d.messages)
          setVisibleCount(0)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (visibleCount >= messages.length) return
    const timer = setTimeout(() => {
      setVisibleCount(v => v + 1)
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      })
    }, visibleCount === 0 ? 400 : 1200)
    return () => clearTimeout(timer)
  }, [visibleCount, messages.length])

  async function handleRefresh() {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/tavern/generate`, { method: 'POST' })
      if (res.ok) {
        const d = await res.json()
        if (d.messages?.length > 0) {
          setMessages(d.messages)
          setVisibleCount(0)
        }
      }
    } catch {}
    setLoading(false)
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: '#0d0a06',
    }}>
      {/* Header bar with actions */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '4px 8px',
        background: '#1a140c',
        borderBottom: '1px solid #3a2210',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'var(--font-pixel)', fontSize: '5px',
          color: '#5c4a2a', letterSpacing: '1px', flex: 1,
        }}>
          TAVERN CHATTER
        </span>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            fontFamily: 'var(--font-pixel)', fontSize: '4px',
            padding: '2px 6px', cursor: loading ? 'wait' : 'pointer',
            background: '#1a140c', border: '1px solid #3a2210',
            color: '#5c4a2a',
          }}
        >
          {loading ? '...' : 'NEW GOSSIP'}
        </button>
        {onRumorsClick && (
          <button
            onClick={onRumorsClick}
            disabled={rumorsLoading}
            style={{
              fontFamily: 'var(--font-pixel)', fontSize: '4px',
              padding: '2px 6px', cursor: rumorsLoading ? 'wait' : 'pointer',
              background: '#1a140c', border: '1px solid #6b4c2a',
              color: '#f0e68c',
            }}
          >
            {rumorsLoading ? '...' : 'HEAR RUMORS'}
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflow: 'auto', padding: '4px 8px',
          display: 'flex', flexDirection: 'column', gap: '2px',
        }}
      >
        {messages.length === 0 ? (
          <div
            onClick={handleRefresh}
            style={{
              fontFamily: 'var(--font-pixel)', fontSize: '5px',
              color: '#3a2a16', textAlign: 'center',
              padding: '12px', cursor: 'pointer',
            }}
          >
            {loading ? '...' : 'The tavern is quiet... Click to eavesdrop.'}
          </div>
        ) : (
          messages.slice(0, visibleCount).map((msg, i) => {
            const s = NPC_STYLE[msg.npc] || { color: '#c8a87a', mark: '-' }
            return (
              <div key={i} style={{ lineHeight: '1.5' }}>
                <span style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '5px',
                  color: '#3a2a16',
                }}>
                  {s.mark}
                </span>
                <span style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '6px',
                  color: s.color,
                  marginLeft: '3px',
                }}>
                  {msg.name}
                </span>
                <span style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '5px',
                  color: '#a89878',
                  marginLeft: '6px',
                }}>
                  {msg.text}
                </span>
              </div>
            )
          })
        )}

        {visibleCount > 0 && visibleCount < messages.length && (
          <span style={{
            fontFamily: 'var(--font-pixel)', fontSize: '5px',
            color: '#3a2a16',
          }}>
            ...
          </span>
        )}
      </div>
    </div>
  )
}
