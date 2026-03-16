import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { API_URL } from '../api'
import { LS_KEYS } from '../constants/storage'
import { npcGreeting, npcSuggestions } from '../constants/npc'
import type { NpcData } from '../constants/npc'
import BackButton from '../components/BackButton'
import RpgButton from '../components/RpgButton'

/** RPG dialog inline — replaces NPC bar in the bottom area */
export default function RpgDialogInline({ npc, onClose, chatHistoryRef, prefillMessage }: {
  npc: NpcData
  onClose: () => void
  chatHistoryRef: React.MutableRefObject<Record<string, Array<{ role: 'npc' | 'user'; text: string }>>>
  prefillMessage?: string | null
}) {
  const existing = chatHistoryRef.current[npc.id]
  const [messages, setMessages] = useState<Array<{ role: 'npc' | 'user'; text: string }>>(
    existing && existing.length > 0 ? existing : [{ role: 'npc', text: npcGreeting(npc) }]
  )
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const suggestions = npcSuggestions(npc)
  const prefillHandled = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeTab = useStore((s) => s.activeTab)
  const selectedBagItems = useStore((s) => s.selectedBagItems)
  const selectedRegion = useStore((s) => s.selectedRegion)
  const gameState = useStore((s) => s.state)

  // Persist messages back to ref + localStorage on every change
  useEffect(() => {
    // Keep max 20 messages per NPC to avoid localStorage bloat
    const trimmed = messages.length > 20 ? messages.slice(-20) : messages
    chatHistoryRef.current[npc.id] = trimmed
    try {
      localStorage.setItem(LS_KEYS.npcHistory, JSON.stringify(chatHistoryRef.current))
    } catch {}
  }, [messages, npc.id, chatHistoryRef])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
  }, [messages, loading])

  // Handle prefill message from bag "SHOW TO NPC"
  useEffect(() => {
    if (prefillMessage && !prefillHandled.current) {
      prefillHandled.current = true
      // Slight delay to ensure component is fully mounted with messages
      setTimeout(() => handleSend(prefillMessage), 100)
    }
  }, [prefillMessage]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend(msg?: string) {
    const text = (msg || input).trim()
    if (!text || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    setLoading(true)
    try {
      const history = messages.map(m => ({ role: m.role === 'npc' ? 'assistant' : 'user', content: m.text }))
      const res = await fetch(`${API_URL}/api/npc/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npc: npc.id,
          message: text,
          history,
          context: { active_tab: activeTab, selected_bag_items: selectedBagItems, selected_region: selectedRegion },
          game_state: gameState ? {
            name: gameState.name,
            level: gameState.level,
            class: gameState.class,
            title: gameState.title,
            hp: gameState.hp,
            hp_max: gameState.hp_max,
            mp: gameState.mp,
            mp_max: gameState.mp_max,
            gold: gameState.gold,
            skills_count: gameState.skills_count,
          } : undefined,
        }),
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        console.error(`[NPC chat] HTTP ${res.status}:`, errText)
        setMessages((m) => [...m, { role: 'npc', text: `*looks confused* (Error ${res.status})` }])
        setLoading(false)
        return
      }
      const data = await res.json()
      setMessages((m) => [...m, { role: 'npc', text: data.reply || '...' }])
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Connection error'
      console.error('[NPC chat] fetch error:', errMsg)
      setMessages((m) => [...m, { role: 'npc', text: `*stares silently* (${errMsg})` }])
    }
    setLoading(false)
  }

  return (
    <div style={{
      display: 'flex', gap: '12px',
      width: '100%', height: '100%',
      padding: '8px 12px',
    }}>
      {/* Left: portrait + back */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <img src={npc.img} alt="" style={{
          width: '80px', height: '80px', imageRendering: 'pixelated',
          borderRadius: '3px',
        }} />
        <BackButton onClick={onClose} />
        {messages.length > 1 && (
          <button onClick={() => {
            const fresh = [{ role: 'npc' as const, text: npcGreeting(npc) }]
            setMessages(fresh)
            chatHistoryRef.current[npc.id] = fresh
            try { localStorage.setItem(LS_KEYS.npcHistory, JSON.stringify(chatHistoryRef.current)) } catch {}
          }} style={{
            fontFamily: 'var(--font-pixel)', fontSize: '5px', padding: '2px 6px',
            background: 'transparent', border: '1px solid rgba(255,107,107,0.4)',
            color: '#ff6b6b', cursor: 'pointer', letterSpacing: '0.5px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >CLEAR</button>
        )}
      </div>

      {/* Right: dialog content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
        {/* NPC name */}
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: '#f0e68c', letterSpacing: '1px' }}>
          {npc.name}
        </div>

        {/* Scrollable message history */}
        <div ref={scrollRef} style={{
          flex: 1, overflow: 'auto',
          display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              fontSize: '12px', lineHeight: '1.6',
              fontFamily: m.role === 'user' ? 'var(--font-mono)' : 'Georgia, serif',
              color: m.role === 'user' ? '#90ee90' : '#e8d5b0',
              padding: '3px 6px',
              borderLeft: m.role === 'user' ? '2px solid rgba(144,238,144,0.3)' : '2px solid rgba(240,230,140,0.3)',
              background: m.role === 'user' ? 'rgba(144,238,144,0.05)' : 'transparent',
            }}>
              <span style={{
                fontFamily: 'var(--font-pixel)', fontSize: '6px',
                color: m.role === 'user' ? '#90ee90' : '#f0e68c',
                marginRight: '6px', letterSpacing: '0.5px',
              }}>
                {m.role === 'user' ? 'YOU' : npc.name.toUpperCase()}
              </span>
              {m.text}
            </div>
          ))}
          {loading && (
            <div style={{
              fontSize: '12px', lineHeight: '1.6', fontFamily: 'Georgia, serif',
              color: '#8b7355', fontStyle: 'italic', padding: '3px 6px',
              borderLeft: '2px solid rgba(240,230,140,0.3)',
            }}>
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: '#f0e68c', marginRight: '6px' }}>
                {npc.name.toUpperCase()}
              </span>
              ...
            </div>
          )}
        </div>

        {!loading && messages.length <= 2 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {suggestions.map((q, i) => (
              <button key={i} onClick={() => handleSend(q)} style={{
                fontFamily: 'var(--font-pixel)', fontSize: '8px',
                padding: '6px 12px', cursor: 'pointer',
                background: 'linear-gradient(180deg, rgba(90,60,20,0.6) 0%, rgba(60,40,15,0.8) 100%)',
                border: '2px solid #6b4c2a',
                color: '#f0e68c', transition: 'all 0.15s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,220,140,0.1)',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#f0e68c'; e.currentTarget.style.background = 'linear-gradient(180deg, rgba(120,80,30,0.7) 0%, rgba(80,55,20,0.9) 100%)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#6b4c2a'; e.currentTarget.style.background = 'linear-gradient(180deg, rgba(90,60,20,0.6) 0%, rgba(60,40,15,0.8) 100%)' }}
              >{q}</button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '4px' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Talk to ${npc.name}...`}
            disabled={loading}
            style={{
              flex: 1, padding: '5px 8px',
              background: 'rgba(10,8,4,0.6)', border: '1px solid #5c3a1e',
              color: '#e8d5b0', fontFamily: 'var(--font-mono)', fontSize: '10px',
            }}
          />
          <RpgButton onClick={() => handleSend()} disabled={loading || !input.trim()} small>SEND</RpgButton>
        </div>
      </div>
    </div>
  )
}
