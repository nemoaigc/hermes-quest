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
  you:    { color: '#90ee90', mark: '>' },
}

export default function TavernAmbientChat({ onRumorsClick, rumorsLoading, hideHeader }: {
  onRumorsClick?: () => void
  rumorsLoading?: boolean
  hideHeader?: boolean
}) {
  const [messages, setMessages] = useState<TavernMessage[]>([])
  const [visibleCount, setVisibleCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [sending, setSending] = useState(false)
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

  async function handleUserSend() {
    const text = userInput.trim()
    if (!text || sending) return
    setUserInput('')
    // Add user message to chat
    const userMsg: TavernMessage = { npc: 'you', name: 'You', text }
    setMessages(prev => [...prev, userMsg])
    setVisibleCount(prev => prev + 1)
    setSending(true)
    try {
      const res = await fetch(`${API_URL}/api/npc/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ npc: 'bartender', message: text, context: {} }),
      })
      const data = await res.json()
      const reply: TavernMessage = { npc: 'gus', name: 'Gus', text: data.reply || '...' }
      setMessages(prev => [...prev, reply])
      setVisibleCount(prev => prev + 1)
    } catch {
      const reply: TavernMessage = { npc: 'gus', name: 'Gus', text: '*wipes the counter silently*' }
      setMessages(prev => [...prev, reply])
      setVisibleCount(prev => prev + 1)
    }
    setSending(false)
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: 'transparent',
    }}>
      {/* Hidden refresh trigger for external control */}
      <button data-refresh-gossip onClick={handleRefresh} style={{ display: 'none' }} />

      {!hideHeader && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '4px 10px',
          flexShrink: 0,
        }}>
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              fontFamily: 'var(--font-pixel)', fontSize: '6px',
              padding: '4px 10px', cursor: loading ? 'wait' : 'pointer',
              background: 'linear-gradient(180deg, #6a4428 0%, #3a2210 100%)',
              border: '2px solid #6b4c2a',
              color: '#f0e68c',
              boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
            }}
          >
            {loading ? '...' : 'NEW GOSSIP'}
          </button>
        </div>
      )}

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
              <div key={i} style={{
                display: 'flex', gap: '6px', marginBottom: '3px',
                paddingLeft: '4px',
                borderLeft: `2px solid ${s.color}40`,
              }}>
                <span style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '6px',
                  color: s.color, flexShrink: 0, minWidth: '40px',
                }}>
                  {msg.name}
                </span>
                <span style={{
                  fontSize: '9px', color: '#c8a87a', lineHeight: '1.4',
                  fontFamily: 'var(--font-pixel)',
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

      {/* User input bar */}
      <div style={{
        display: 'flex', gap: '4px',
        padding: '4px 8px',
        background: '#1a140c',
        borderTop: '1px solid #3a2210',
        flexShrink: 0,
      }}>
        <input
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleUserSend()}
          placeholder="Say something to the tavern..."
          disabled={sending}
          style={{
            flex: 1, padding: '6px 8px',
            background: 'rgba(10,8,4,0.6)',
            border: '1px solid #3a2210',
            color: '#e8d5b0',
            fontFamily: 'var(--font-pixel)', fontSize: '8px',
            outline: 'none',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#f0e68c' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#3a2210' }}
        />
        <button
          onClick={handleUserSend}
          disabled={sending || !userInput.trim()}
          style={{
            fontFamily: 'var(--font-pixel)', fontSize: '5px',
            padding: '3px 8px',
            cursor: sending ? 'wait' : 'pointer',
            background: sending ? 'rgba(10,8,4,0.5)' : 'linear-gradient(180deg, #6a4428 0%, #4a2a14 50%, #3a2210 100%)',
            border: '2px solid #6b4c2a',
            color: '#f0e68c',
            boxShadow: sending ? 'none' : '0 2px 4px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap' as const,
          }}
        >
          {sending ? '...' : 'SAY'}
        </button>
      </div>
    </div>
  )
}
