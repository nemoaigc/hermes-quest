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

export default function TavernAmbientChat({ hideHeader, refreshRef }: {
  hideHeader?: boolean
  refreshRef?: React.MutableRefObject<(() => void) | null>
}) {
  const [messages, setMessages] = useState<TavernMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [sending, setSending] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/tavern/ambient`)
      .then(r => r.ok ? r.json() : { messages: [] })
      .then(d => {
        if (d.messages?.length > 0) {
          setMessages(d.messages)
          requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
          })
        }
      })
      .catch(() => {
        setChatError('Could not reach the tavern...')
        setTimeout(() => setChatError(null), 5000)
      })
  }, [])

  async function handleRefresh() {
    setLoading(true)
    setChatError(null)
    try {
      const res = await fetch(`${API_URL}/api/tavern/generate`, { method: 'POST' })
      if (!res.ok) {
        setChatError('The bard lost his voice... Try again.')
        setTimeout(() => setChatError(null), 3000)
      } else {
        const d = await res.json()
        if (d.messages?.length > 0) {
          setMessages(d.messages)
          requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
          })
        }
      }
    } catch {
      setChatError('The tavern door is jammed... Try again.')
      setTimeout(() => setChatError(null), 3000)
    }
    setLoading(false)
  }

  // Register handleRefresh on parent ref so external buttons can trigger it
  useEffect(() => {
    if (refreshRef) refreshRef.current = handleRefresh
    return () => { if (refreshRef) refreshRef.current = null }
  }) // eslint-disable-line react-hooks/exhaustive-deps -- intentionally re-registers on every render to capture latest handleRefresh

  async function handleUserSend() {
    const text = userInput.trim()
    if (!text || sending) return
    setUserInput('')
    // Add user message to chat
    const userMsg: TavernMessage = { npc: 'you', name: 'You', text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setSending(true)
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
    try {
      const res = await fetch(`${API_URL}/api/tavern/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: updatedMessages }),
      })
      if (!res.ok) throw new Error(`Reply failed: ${res.status}`)
      const data = await res.json()
      if (data.messages?.length > 0) {
        setMessages(prev => [...prev, ...data.messages])
      }
    } catch {
      const reply: TavernMessage = { npc: 'gus', name: 'Gus', text: '*wipes the counter silently*' }
      setMessages(prev => [...prev, reply])
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

      {/* Error message */}
      {chatError && (
        <div style={{
          padding: '4px 8px', fontFamily: 'var(--font-pixel)',
          fontSize: '5px', color: '#ff6b6b', textAlign: 'center',
          flexShrink: 0,
        }}>
          {chatError}
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
          messages.map((msg, i) => {
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
