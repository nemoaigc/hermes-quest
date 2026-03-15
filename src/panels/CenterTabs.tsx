import { useState, useRef, useEffect, useMemo } from 'react'
import { useStore } from '../store'
import KnowledgeMap from './KnowledgeMap'
import SubRegionGraph from './SubRegionGraph'
import GuildPanel from './GuildPanel'
import Shop from './Shop'
import TavernAmbientChat from '../components/TavernAmbientChat'
import AnimatedBg from '../components/AnimatedBg'
import { API_URL } from '../api'
import type { TabId, NpcId } from '../types'

// Extend window for SHOW TO NPC bridge
declare global {
  interface Window {
    __hermesShowToNpc?: (message: string) => void
  }
}

const NPCS: Array<{ id: NpcId; name: string; title: string; img: string }> = [
  { id: 'guild_master', name: 'Lyra', title: 'Guild Master', img: '/npc/guild-master.png' },
  { id: 'cartographer', name: 'Aldric', title: 'Cartographer', img: '/npc/cartographer.png' },
  { id: 'quartermaster', name: 'Kael', title: 'Quartermaster', img: '/npc/quartermaster.png' },
  { id: 'bartender' as NpcId, name: 'Gus', title: 'Bartender', img: '/npc/bartender.png' },
  { id: 'sage' as NpcId, name: 'Orin', title: 'Sage', img: '/npc/sage.png' },
]

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'map', label: 'MAP', icon: '\u{1F5FA}' },
  { id: 'guild', label: 'GUILD', icon: '\u2694' },
  { id: 'shop', label: 'SHOP', icon: '\u{1F3EA}' },
  { id: 'npc', label: 'TAVERN', icon: '\u{1F37A}' },
]

/** Tavern SCENE area — 3 modes: default / chatter / rumors */
function TavernSceneArea({ sceneMode, onSceneMode, rumors, rumorsLoading, rumorsError, onFetchRumors, gossipRefreshRef }: {
  sceneMode: 'default' | 'chatter' | 'rumors'
  onSceneMode: (mode: 'default' | 'chatter' | 'rumors') => void
  rumors: Array<{ id: string; text: string; author: string; handle: string; likes: number; time: string }>
  rumorsLoading: boolean
  rumorsError?: string | null
  onFetchRumors: () => void
  gossipRefreshRef: React.MutableRefObject<(() => void) | null>
}) {
  const dimmed = sceneMode !== 'default'
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <AnimatedBg prefix="tavern" fallback="/bg/npc-bg.png" style={{
        filter: dimmed ? 'brightness(0.25)' : 'none',
        transition: 'filter 0.3s',
      }} />

      {/* Tab bar at top — always visible */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
        display: 'flex',
      }}>
        {(['chatter', 'rumors'] as const).map(tab => {
          const active = sceneMode === tab
          return (
            <button
              key={tab}
              onClick={() => { onSceneMode(active ? 'default' : tab); if (tab === 'rumors' && !active) onFetchRumors() }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = '#c8a87a'; e.currentTarget.style.background = 'rgba(13,10,6,0.7)' } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = '#8b7355'; e.currentTarget.style.background = 'rgba(13,10,6,0.5)' } }}
              style={{
                flex: 1, padding: '8px 0',
                fontFamily: 'var(--font-pixel)', fontSize: '8px',
                letterSpacing: '2px',
                background: active ? 'rgba(13,10,6,0.85)' : 'rgba(13,10,6,0.5)',
                border: 'none',
                borderBottom: active ? '2px solid #f0e68c' : '2px solid transparent',
                color: active ? '#f0e68c' : '#8b7355',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tab.toUpperCase()}
            </button>
          )
        })}
      </div>

      {/* Chatter content */}
      {sceneMode === 'chatter' && (
        <div style={{ position: 'absolute', top: '32px', left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '4px 8px', flexShrink: 0,
          }}>
            <BackButton onClick={() => onSceneMode('default')} />
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: '#f0e68c', letterSpacing: '1px' }}>
              TAVERN CHATTER
            </span>
            <span style={{ flex: 1 }} />
            <RpgButton onClick={() => gossipRefreshRef.current?.()} small>NEW GOSSIP</RpgButton>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <TavernAmbientChat hideHeader refreshRef={gossipRefreshRef} />
          </div>
        </div>
      )}

      {/* Rumors content */}
      {sceneMode === 'rumors' && (
        <div style={{ position: 'absolute', top: '32px', left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '4px 8px', flexShrink: 0,
          }}>
            <BackButton onClick={() => onSceneMode('default')} />
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: '#f0e68c', letterSpacing: '1px' }}>
              REALM RUMORS
            </span>
            <span style={{ flex: 1 }} />
            <button
              onClick={onFetchRumors}
              disabled={rumorsLoading}
              style={{
                fontFamily: 'var(--font-pixel)', fontSize: '5px',
                padding: '3px 8px', cursor: rumorsLoading ? 'wait' : 'pointer',
                background: 'linear-gradient(180deg, #6a4428 0%, #4a2a14 50%, #3a2210 100%)',
                border: '2px solid #6b4c2a',
                color: '#f0e68c',
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
              }}
            >
              {rumorsLoading ? '...' : 'REFRESH'}
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '4px 10px' }}>
            {rumorsLoading ? (
              <div style={{
                textAlign: 'center', color: '#c8a87a', fontStyle: 'italic',
                fontSize: '10px', fontFamily: 'var(--font-pixel)',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                marginTop: '20px',
              }}>
                You lean in and listen...
              </div>
            ) : rumorsError ? (
              <div style={{
                textAlign: 'center', color: '#ff6b6b',
                fontSize: '6px', fontFamily: 'var(--font-pixel)',
                marginTop: '20px',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              }}>
                {rumorsError}
              </div>
            ) : rumors.length === 0 ? (
              <div style={{
                textAlign: 'center', color: '#5c4a2a',
                fontSize: '6px', fontFamily: 'var(--font-pixel)',
                marginTop: '20px', cursor: 'pointer',
              }} onClick={onFetchRumors}>
                No whispers yet... Click to listen.
              </div>
            ) : rumors.map((r) => (
              <a
                key={r.id}
                href={`https://x.com/${r.handle}/status/${r.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', textDecoration: 'none',
                  marginBottom: '6px', padding: '6px 8px',
                  background: 'rgba(26,18,10,0.85)',
                  border: '1px solid rgba(139,94,60,0.4)',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f0e68c' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(139,94,60,0.4)' }}
              >
                <div style={{
                  fontSize: '9px', color: '#e8d5b0', lineHeight: '1.4',
                  fontFamily: 'var(--font-pixel)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}>
                  "{r.text.length > 150 ? r.text.slice(0, 150) + '...' : r.text}"
                </div>
                <div style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '4px',
                  color: '#8b7355', marginTop: '2px',
                  display: 'flex', gap: '8px',
                }}>
                  <span>-- @{r.handle}</span>
                  <span style={{ color: '#6b4c2a' }}>{r.likes} likes</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** Tavern BOTTOM panel — 3 states: NPC gallery / NPC bio card / NPC chat */
function TavernNpcPanel({ activeNpc, onNpcSelect, chatNpc, onNpcChat, onCloseBio, onCloseChat, chatHistoryRef, npcPrefill }: {
  activeNpc: string | null
  onNpcSelect: (id: string) => void
  chatNpc: string | null
  onNpcChat: (id: string) => void
  onCloseBio: () => void
  onCloseChat: () => void
  chatHistoryRef: React.MutableRefObject<Record<string, Array<{ role: 'npc' | 'user'; text: string }>>>
  npcPrefill?: string | null
}) {
  const selectedNpcData = activeNpc ? NPCS.find(n => n.id === activeNpc) : null
  const chatNpcData = chatNpc ? NPCS.find(n => n.id === chatNpc) : null
  const bio = activeNpc ? NPC_BIOS[activeNpc] : null

  /* ---- State 3: NPC Chat ---- */
  if (chatNpc && chatNpcData) {
    return (
      <div style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <RpgDialogInline npc={chatNpcData} onClose={onCloseChat} chatHistoryRef={chatHistoryRef} prefillMessage={npcPrefill} />
      </div>
    )
  }

  /* ---- State 2: NPC Bio Card (old horizontal layout) ---- */
  if (activeNpc && selectedNpcData && bio) {
    return (
      <div style={{
        display: 'flex', gap: '12px', width: '100%', height: '100%', padding: '8px 12px',
      }}>
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <img src={selectedNpcData.img} alt="" style={{
            width: '80px', height: '80px', imageRendering: 'pixelated',
            borderRadius: '3px',
          }} />
          <BackButton onClick={onCloseBio} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'auto' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: '#f0e68c', letterSpacing: '1px' }}>
              {selectedNpcData.name}
            </div>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: '#8b7355', marginTop: '2px' }}>
              {selectedNpcData.title}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: 'var(--cyan)', letterSpacing: '0.5px' }}>
            {bio.trait}
          </div>
          <div style={{
            fontSize: '13px', color: '#c8a87a', lineHeight: '1.7',
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
          }}>
            "{bio.lore}"
          </div>
        </div>
      </div>
    )
  }

  /* ---- State 1: NPC Gallery ---- */
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
    }}>
      {/* Ornamental title */}
      <div style={{
        textAlign: 'center', padding: '4px 0 2px', flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 'clamp(5px, 0.7vw, 8px)', color: '#8b6a3c' }}>{'\u2554'} </span>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 'clamp(6px, 0.8vw, 9px)', color: '#f0e68c', letterSpacing: '2px' }}>RESIDENTS</span>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 'clamp(5px, 0.7vw, 8px)', color: '#8b6a3c' }}> {'\u2557'}</span>
      </div>
      <div style={{
        display: 'flex', flex: 1, minHeight: 0,
      }}>
      {NPCS.map((npc) => {
        const isActive = activeNpc === npc.id
        return (
          <div
            key={npc.id}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: isActive
                ? 'linear-gradient(180deg, rgba(50,35,20,0.6) 0%, rgba(35,25,15,0.7) 100%)'
                : 'linear-gradient(180deg, rgba(40,28,16,0.5) 0%, rgba(28,20,12,0.6) 100%)',
              border: '1px solid rgba(139,94,60,0.3)',
              borderTop: '1px solid rgba(180,140,80,0.15)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3), 0 1px 0 rgba(139,94,60,0.1)',
              borderRadius: '2px',
              margin: '2px',
              padding: '4px 2px',
              overflow: 'hidden',
            }}
          >
            <img
              src={npc.img}
              alt={npc.name}
              onClick={() => onNpcSelect(npc.id)}
              onMouseEnter={(e) => { e.currentTarget.style.border = '2px solid #f0e68c'; e.currentTarget.style.transform = 'scale(1.05)' }}
              onMouseLeave={(e) => { e.currentTarget.style.border = 'none'; e.currentTarget.style.transform = 'scale(1)' }}
              style={{
                width: '100%', maxWidth: '80px', aspectRatio: '1',
                objectFit: 'cover',
                imageRendering: 'pixelated',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            />
            <span style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: 'clamp(4px, 0.6vw, 6px)',
              color: isActive ? '#f0e68c' : '#c8a87a',
              marginTop: '3px',
              letterSpacing: '0.5px',
            }}>
              {npc.name}
            </span>
            <span style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: 'clamp(3px, 0.4vw, 5px)',
              color: '#6a5a3a',
            }}>
              {npc.title}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onNpcChat(npc.id) }}
              style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: 'clamp(3px, 0.4vw, 5px)',
                padding: '2px 8px',
                marginTop: '3px',
                cursor: 'pointer',
                background: isActive
                  ? 'linear-gradient(180deg, #7a5030 0%, #5a3820 100%)'
                  : 'transparent',
                border: isActive ? '1px solid #f0e68c' : '1px solid rgba(139,94,60,0.4)',
                color: isActive ? '#f0e68c' : '#8b7355',
                borderRadius: '2px',
                letterSpacing: '1px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f0e68c'; e.currentTarget.style.color = '#f0e68c' }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.borderColor = 'rgba(139,94,60,0.4)'; e.currentTarget.style.color = '#8b7355' } }}
            >
              CHAT
            </button>
          </div>
        )
      })}
      </div>
    </div>
  )
}

const NPC_BIOS: Record<string, { lore: string; trait: string }> = {
  guild_master: {
    lore: 'Once a legendary adventurer herself, Lyra retired to manage the guild after a fateful expedition. She has an eye for potential and knows exactly which quest will push you to grow.',
    trait: 'Assigns quests \u00B7 Evaluates progress',
  },
  cartographer: {
    lore: 'Aldric has mapped every corner of the known world and several that shouldn\'t exist. His spectacles see not just places, but the connections between all things.',
    trait: 'Maps knowledge \u00B7 Finds weak spots',
  },
  quartermaster: {
    lore: 'Kael earned her silver hair in battle, not from age. She knows every weapon, tool, and skill in the armory \u2014 and exactly which one you need.',
    trait: 'Manages skills \u00B7 Recommends gear',
  },
  bartender: {
    lore: 'Gus hears everything. Every boast, every whisper, every secret spilled over a drink. He remembers it all and shares only what matters.',
    trait: 'Shares gossip \u00B7 Tells stories',
  },
  sage: {
    lore: 'No one knows how old Orin truly is. Some say he\'s read every book ever written. When the world feels too complex, his wisdom cuts through the fog.',
    trait: 'Deep analysis \u00B7 Reflection',
  },
}

/** Shared back button style */
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: 'var(--font-pixel)', fontSize: '6px', padding: '4px 10px',
      background: 'transparent', border: '1px solid rgba(139,94,60,0.5)',
      color: '#8b7355', cursor: 'pointer', letterSpacing: '1px',
      transition: 'all 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#f0e68c'; e.currentTarget.style.color = '#f0e68c' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,94,60,0.5)'; e.currentTarget.style.color = '#8b7355' }}
    >{'\u25C0'} BACK</button>
  )
}


/** RPG dialog inline — replaces NPC bar in the bottom area */
function RpgDialogInline({ npc, onClose, chatHistoryRef, prefillMessage }: {
  npc: typeof NPCS[0]
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

  // Persist messages back to ref + localStorage on every change
  useEffect(() => {
    // Keep max 20 messages per NPC to avoid localStorage bloat
    const trimmed = messages.length > 20 ? messages.slice(-20) : messages
    chatHistoryRef.current[npc.id] = trimmed
    try {
      localStorage.setItem('hermes-npc-chat-history', JSON.stringify(chatHistoryRef.current))
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
    } catch (err: any) {
      console.error('[NPC chat] fetch error:', err?.message || err)
      setMessages((m) => [...m, { role: 'npc', text: `*stares silently* (${err?.message || 'Connection error'})` }])
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
            try { localStorage.setItem('hermes-npc-chat-history', JSON.stringify(chatHistoryRef.current)) } catch {}
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

function npcGreeting(npc: typeof NPCS[0]): string {
  const greetings: Record<string, string> = {
    guild_master: "Welcome, adventurer~ Looking for a quest? I've got some interesting ones today...",
    cartographer: "Ah, a fellow seeker of knowledge. What domain shall we explore?",
    quartermaster: "Need gear? I've got the best equipment this side of the realm.",
    bartender: "What'll it be? Pull up a stool and tell me what's on your mind.",
    sage: "I sense you seek wisdom... Ask, and I shall peer into the depths of knowledge.",
  }
  return greetings[npc.id] || `${npc.name} nods at you.`
}

function npcSuggestions(npc: typeof NPCS[0]): string[] {
  const suggestions: Record<string, string[]> = {
    guild_master: ["What quests are available?", "How's my progress?", "Any urgent tasks?"],
    cartographer: ["Show me unexplored regions", "What should I learn next?", "Map my skills"],
    quartermaster: ["What skills should I acquire?", "Evaluate my inventory", "Best gear for me?"],
    bartender: ["Tell me a story", "Any gossip today?", "What's happening in the realm?"],
    sage: ["Analyze my growth", "Deep research on AI", "What's my weakness?"],
  }
  return suggestions[npc.id] || ["Hello", "Tell me more"]
}

/** Reusable RPG panel card */
function PanelCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      padding: '6px 8px',
      background: 'linear-gradient(180deg, rgba(20,14,8,0.7) 0%, rgba(10,8,4,0.8) 100%)',
      border: '1px solid rgba(139,94,60,0.4)',
      borderTop: '1px solid rgba(180,140,80,0.2)',
      borderRadius: '2px',
      boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.5), 0 1px 0 rgba(139,94,60,0.15)',
      ...style,
    }}>{children}</div>
  )
}

/** Reusable RPG button */
function RpgButton({ children, onClick, disabled, small, color }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; small?: boolean; color?: string }) {
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.borderColor = '#f0e68c'; e.currentTarget.style.boxShadow = '0 0 8px rgba(240,230,140,0.3), 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,220,140,0.1)' } }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#6b4c2a'; e.currentTarget.style.boxShadow = disabled ? 'none' : '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,220,140,0.1)' }}
      style={{
      fontFamily: 'var(--font-pixel)', fontSize: small ? '5px' : '6px',
      padding: small ? '4px 8px' : '6px 14px',
      cursor: disabled ? 'wait' : 'pointer',
      background: disabled ? 'rgba(10,8,4,0.5)' : color ? color : 'linear-gradient(180deg, #6a4428 0%, #4a2a14 50%, #3a2210 100%)',
      border: '2px solid #6b4c2a',
      color: '#f0e68c',
      boxShadow: disabled ? 'none' : '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,220,140,0.1)',
      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
      whiteSpace: 'nowrap' as const,
      transition: 'all 0.15s',
    }}>{children}</button>
  )
}

/** MAP bottom — two columns: workflow list + stats & action */
function MapBottomInfo() {
  const km = useStore((s) => s.knowledgeMap)
  const state = useStore((s) => s.state)
  const [cycleLoading, setCycleLoading] = useState(false)
  const workflows = km?.workflows || km?.continents || []
  const fogCount = km?.fog_regions?.length || 0
  const avgMastery = workflows.length > 0
    ? workflows.reduce((a, w) => a + ((w as any).mastery || 0), 0) / workflows.length
    : 0

  const [cycleStatus, setCycleStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle')

  async function startCycle() {
    setCycleLoading(true)
    setCycleStatus('loading')
    try {
      const res = await fetch(`${API_URL}/api/cycle/start`, { method: 'POST' })
      if (res.ok) {
        setCycleStatus('success')
        setTimeout(() => { setCycleLoading(false); setCycleStatus('idle') }, 2000)
      } else {
        setCycleStatus('failed')
        setTimeout(() => { setCycleLoading(false); setCycleStatus('idle') }, 2000)
      }
    } catch {
      setCycleStatus('failed')
      setTimeout(() => { setCycleLoading(false); setCycleStatus('idle') }, 2000)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '10px', width: '100%', fontFamily: 'var(--font-pixel)' }}>
      {/* Left: mini map preview — scattered nodes */}
      <PanelCard style={{ flex: 1, position: 'relative', minHeight: '60px', overflow: 'hidden' }}>
        {workflows.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '8px', color: '#6a5a3a', fontStyle: 'italic' }}>
            Start a cycle to explore...
          </div>
        ) : (
          <>
            {workflows.map((w: any, i: number) => {
              const angle = (i / Math.max(workflows.length, 1)) * Math.PI * 2
              const r = 30
              const cx = 50 + Math.cos(angle) * r
              const cy = 50 + Math.sin(angle) * r
              const catColor: Record<string, string> = { coding: 'var(--cyan)', research: 'var(--purple)', automation: 'var(--gold)', creative: '#ff9944' }
              return (
                <div key={w.id} title={`${w.name} \u2014 ${Math.round((w.mastery || 0) * 100)}%`} style={{
                  position: 'absolute',
                  left: `${cx}%`, top: `${cy}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${12 + (w.mastery || 0) * 16}px`,
                  height: `${12 + (w.mastery || 0) * 16}px`,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, ${catColor[w.category] || '#8b7355'}, rgba(0,0,0,0.6))`,
                  border: '1px solid rgba(200,160,100,0.3)',
                  boxShadow: `0 0 ${4 + (w.mastery || 0) * 8}px ${catColor[w.category] || '#8b7355'}40`,
                  cursor: 'pointer',
                }} />
              )
            })}
            {/* Connection lines */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              {workflows.length > 1 && workflows.slice(0, -1).map((_: any, i: number) => {
                const a1 = (i / workflows.length) * Math.PI * 2
                const a2 = ((i + 1) / workflows.length) * Math.PI * 2
                return <line key={i} x1={`${50 + Math.cos(a1) * 30}%`} y1={`${50 + Math.sin(a1) * 30}%`} x2={`${50 + Math.cos(a2) * 30}%`} y2={`${50 + Math.sin(a2) * 30}%`} stroke="rgba(139,94,60,0.3)" strokeWidth="1" strokeDasharray="3 2" />
              })}
            </svg>
            {fogCount > 0 && <div style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '4px', color: '#6a5a3a', fontFamily: 'var(--font-pixel)' }}>?x{fogCount}</div>}
          </>
        )}
      </PanelCard>

      {/* Right: stats column + action */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '120px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <PanelCard style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#f0e68c', lineHeight: 1 }}>{workflows.length}</div>
            <div style={{ fontSize: '4px', color: '#8b7355', marginTop: '2px' }}>REGIONS</div>
          </PanelCard>
          <PanelCard style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: 'var(--cyan)', lineHeight: 1 }}>{Math.round(avgMastery * 100)}%</div>
            <div style={{ fontSize: '4px', color: '#8b7355', marginTop: '2px' }}>MASTERY</div>
          </PanelCard>
        </div>
        <RpgButton onClick={startCycle} disabled={cycleLoading}>
          {cycleStatus === 'loading' ? 'EXPLORING...' : cycleStatus === 'success' ? 'CYCLE STARTED' : cycleStatus === 'failed' ? 'FAILED' : '\u25B6 START CYCLE'}
        </RpgButton>
      </div>
    </div>
  )
}

/** GUILD bottom — task list with DONE buttons */
function GuildBottomInfo() {
  const quests = useStore((s) => s.quests)
  const setQuests = useStore((s) => s.setQuests)
  const setKnowledgeMap = useStore((s) => s.setKnowledgeMap)
  const [input, setInput] = useState('')
  const [creating, setCreating] = useState(false)
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const activeQuests = quests.filter((q) => q.status === 'active' || q.status === 'in_progress' || q.status === 'pending')

  async function refreshQuests() {
    try {
      const [questRes, mapRes] = await Promise.all([
        fetch(`${API_URL}/api/quest/active`),
        fetch(`${API_URL}/api/map`),
      ])
      if (questRes.ok) {
        const d = await questRes.json()
        setQuests(d.quests || [])
      }
      if (mapRes.ok) {
        const d = await mapRes.json()
        setKnowledgeMap(d)
      }
    } catch (e) { console.error('refreshQuests failed', e) }
  }

  async function createTask() {
    const title = input.trim()
    if (!title || creating) return
    setInput('')
    setCreating(true)
    try {
      const res = await fetch(`${API_URL}/api/quest/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, source: 'user' }) })
      if (!res.ok) throw new Error(`Create failed: ${res.status}`)
      await refreshQuests()
      setAllQuestsTrigger(t => t + 1)
    } catch (e) {
      console.error('createTask failed', e)
      setInput(title)
      setCreateError('Quest scroll was lost in transit...')
      setTimeout(() => setCreateError(null), 3000)
    }
    setCreating(false)
  }

  const [questTab, setQuestTab] = useState<'active' | 'cancelled' | 'failed'>('active')
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [editingQuest, setEditingQuest] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  async function cancelQuest(questId: string) {
    setCancelling(questId)
    try {
      const res = await fetch(`${API_URL}/api/quest/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quest_id: questId }) })
      if (!res.ok) throw new Error(`Cancel failed: ${res.status}`)
      await refreshQuests()
      setAllQuestsTrigger(t => t + 1)
    } catch (e) {
      console.error('cancelQuest failed', e)
      setCancelError(questId)
      setTimeout(() => setCancelError(null), 3000)
    }
    setCancelling(null)
  }

  // Fetch all quests (including done/cancelled) for tab display
  const [allQuests, setAllQuests] = useState<any[]>([])
  const [allQuestsTrigger, setAllQuestsTrigger] = useState(0)
  useEffect(() => {
    fetch(`${API_URL}/api/quests`).then(r => { if (!r.ok) throw new Error(`Quests fetch: ${r.status}`); return r.json() }).then(d => setAllQuests(Array.isArray(d) ? d : [])).catch(e => console.error('allQuests fetch failed', e))
  }, [allQuestsTrigger])
  const cancelledQuests = allQuests.filter(q => q.status === 'cancelled')
  const failedQuests = allQuests.filter(q => q.status === 'failed')

  const tabQuests = questTab === 'active' ? activeQuests : questTab === 'cancelled' ? cancelledQuests : failedQuests

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Tabs: ACTIVE / CANCELLED / FAILED */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px', flexShrink: 0 }}>
        {(['active', 'cancelled', 'failed'] as const).map(tab => (
          <button key={tab} onClick={() => setQuestTab(tab)} style={{
            fontFamily: 'var(--font-pixel)', fontSize: '6px', padding: '2px 6px',
            background: questTab === tab ? 'rgba(90,60,20,0.5)' : 'transparent',
            border: 'none', borderBottom: questTab === tab ? '2px solid #f0e68c' : '2px solid transparent',
            color: questTab === tab ? '#f0e68c' : '#8b7355', cursor: 'pointer',
            letterSpacing: '1px',
          }}>
            {tab.toUpperCase()} ({tab === 'active' ? activeQuests.length : tab === 'cancelled' ? cancelledQuests.length : failedQuests.length})
          </button>
        ))}
      </div>

      {/* Scrollable quest list */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {tabQuests.length === 0 ? (
          <div style={{ fontSize: '10px', color: '#6a5a3a', fontStyle: 'italic', fontFamily: 'Georgia, serif', padding: '8px' }}>
            {questTab === 'active' ? 'No active quests.' : questTab === 'cancelled' ? 'No cancelled quests.' : 'No failed quests.'}
          </div>
        ) : tabQuests.map((q) => {
          const isExpanded = expandedQuest === q.id
          return (
          <div key={q.id} style={{
            marginBottom: '3px', fontSize: '10px', padding: '3px 6px',
            borderLeft: `3px solid ${questTab === 'active' ? '#f0e68c' : questTab === 'cancelled' ? '#6b7280' : '#ff6b6b'}`,
            cursor: 'pointer',
            background: isExpanded ? 'rgba(90,60,20,0.15)' : 'transparent',
            transition: 'background 0.1s',
          }}
          onClick={() => setExpandedQuest(isExpanded ? null : q.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {editingQuest === q.id ? (
                <input
                  autoFocus
                  defaultValue={q.title}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value.trim()
                      if (val && val !== q.title) {
                        try {
                          const res = await fetch(`${API_URL}/api/quest/edit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quest_id: q.id, title: val }) })
                          if (!res.ok) throw new Error(`Edit failed: ${res.status}`)
                          await refreshQuests()
                        } catch (err) { console.error('quest edit failed', err) }
                      }
                      setEditingQuest(null)
                    } else if (e.key === 'Escape') setEditingQuest(null)
                  }}
                  onBlur={() => setEditingQuest(null)}
                  style={{
                    width: '100%', padding: '2px 4px', fontSize: '10px',
                    fontFamily: 'var(--font-pixel)',
                    background: 'rgba(10,8,4,0.8)', border: '1px solid #38bdf8',
                    color: '#f0e68c', outline: 'none',
                  }}
                />
              ) : (
                <div style={{
                  color: questTab === 'active' ? '#e8d5b0' : questTab === 'cancelled' ? '#7a7a7a' : '#ff8a8a',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  textDecoration: questTab === 'cancelled' ? 'line-through' : 'none',
                  opacity: questTab === 'cancelled' ? 0.6 : 1,
                }}>{q.title || '(untitled)'}</div>
              )}
              <div style={{ fontSize: '5px', color: '#8b7355', fontFamily: 'var(--font-pixel)', marginTop: '1px' }}>{q.source === 'user' ? 'YOU' : 'AGENT'}</div>
            </div>
            {questTab === 'active' && (
              <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setEditingQuest(editingQuest === q.id ? null : q.id)} style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '5px', padding: '2px 5px', cursor: 'pointer',
                  background: editingQuest === q.id ? 'rgba(56,152,236,0.15)' : 'transparent',
                  border: '1px solid rgba(56,152,236,0.5)', color: '#38bdf8', borderRadius: '2px',
                }}>{editingQuest === q.id ? 'ESC' : 'EDIT'}</button>
                <button onClick={() => cancelQuest(q.id)} disabled={cancelling === q.id} style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '5px', padding: '2px 5px', cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(255,107,107,0.4)', color: '#ff6b6b', borderRadius: '2px',
                }}>{cancelling === q.id ? '...' : cancelError === q.id ? 'FAILED' : 'CANCEL'}</button>
              </div>
            )}
            </div>
            {/* Expanded description */}
            {isExpanded && q.description && (
              <div style={{
                marginTop: '4px', padding: '4px 6px',
                fontSize: '9px', color: '#c8a87a', lineHeight: '1.5',
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                borderTop: '1px solid rgba(107,76,42,0.3)',
              }}>
                {q.description}
                {(q.reward_xp || q.reward_gold) && (
                  <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: '#8b7355', marginTop: '3px', fontStyle: 'normal' }}>
                    {q.reward_gold ? `${q.reward_gold}G` : ''}{q.reward_gold && q.reward_xp ? ' / ' : ''}{q.reward_xp ? `${q.reward_xp}XP` : ''}
                    {q.rank ? ` [${q.rank}]` : ''}
                  </div>
                )}
              </div>
            )}
          </div>
          )
        })}
      </div>

      {/* Fixed input at bottom */}
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0, paddingTop: '4px', borderTop: '1px solid rgba(107,76,42,0.3)' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createTask()}
          placeholder="New quest..."
          disabled={creating}
          style={{
            flex: 1, padding: '5px 8px',
            background: 'rgba(10,8,4,0.6)', border: '1px solid #5c3a1e',
            color: '#e8d5b0', fontFamily: 'var(--font-pixel)', fontSize: '8px',
            outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#f0e68c' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#5c3a1e' }}
        />
        <button
          onClick={createTask}
          disabled={creating || !input.trim()}
          style={{
            fontFamily: 'var(--font-pixel)', fontSize: '5px',
            padding: '4px 10px', cursor: creating ? 'wait' : 'pointer',
            background: creating ? 'rgba(10,8,4,0.5)' : 'linear-gradient(180deg, #6a4428 0%, #4a2a14 50%, #3a2210 100%)',
            border: '2px solid #6b4c2a',
            color: '#f0e68c',
            boxShadow: creating ? 'none' : '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,220,140,0.1)',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
          }}
        >{creating ? '...' : 'POST'}</button>
      </div>
      {createError && (
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: '#ff6b6b', padding: '2px 6px' }}>
          {createError}
        </div>
      )}
    </div>
  )
}

/** SHOP bottom — left: source shops, right: skills from selected source */
function ShopBottomInfo() {
  const shopFilter = useStore((s) => s.shopFilter)
  const setShopFilter = useStore((s) => s.setShopFilter)
  const sourceFilter = useStore((s) => s.shopSourceFilter)
  const setSourceFilter = useStore((s) => s.setShopSourceFilter)
  const shopPage = useStore((s) => s.shopPage)
  const setShopPage = useStore((s) => s.setShopPage)

  const hubSkills = useStore((s) => s.hubSkills)

  const SOURCE_COLOR: Record<string, string> = {
    official: 'var(--green)', github: 'var(--cyan)',
    'claude-marketplace': '#b48eff', clawhub: '#ff9944', lobehub: '#55bbff',
  }

  // Dedup + filter
  const displayed = useMemo(() => {
    // Deduplicate by identifier (unique per skill)
    const seen = new Set<string>()
    let list = hubSkills.filter(s => {
      const key = s.identifier || s.name
      if (!s.name || seen.has(key)) return false
      seen.add(key)
      return true
    })
    if (sourceFilter) {
      list = list.filter((s) => {
        const src = s.trust_level === 'builtin' ? 'official' : s.source
        return src === sourceFilter
      })
    }
    if (shopFilter.trim()) {
      const q = shopFilter.toLowerCase()
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      )
    }
    return list
  }, [hubSkills, shopFilter, sourceFilter])

  // Count sources for filter chips (deduped by identifier)
  const sourceCounts = useMemo(() => {
    const seen = new Set<string>()
    const m = new Map<string, number>()
    for (const sk of hubSkills) {
      const key = sk.identifier || sk.name
      if (!sk.name || seen.has(key)) continue
      seen.add(key)
      const src = sk.trust_level === 'builtin' ? 'official' : sk.source
      m.set(src, (m.get(src) || 0) + 1)
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [hubSkills])

  const pageSize = 9
  const totalPages = Math.max(1, Math.ceil(displayed.length / pageSize))
  const safePage = Math.min(shopPage, totalPages - 1)
  const pageItems = displayed.slice(safePage * pageSize, (safePage + 1) * pageSize)

  const btnStyle: React.CSSProperties = {
    fontFamily: 'var(--font-pixel)', fontSize: '6px',
    padding: '2px 6px', cursor: 'pointer',
    background: 'rgba(90,60,20,0.4)', border: '1px solid #5c3a1e', color: '#f0e68c',
    lineHeight: 1,
  }
  const btnDisabled: React.CSSProperties = { ...btnStyle, opacity: 0.3, cursor: 'default' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <div style={{ display: 'flex', gap: '6px', flex: 1, minHeight: 0 }}>
      {/* Left: source filter */}
      <PanelCard style={{ minWidth: '110px', overflow: 'auto' }}>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: '#8b7355', marginBottom: '4px', letterSpacing: '1px' }}>SOURCES</div>
        {sourceCounts.map(([src, count]) => (
          <div
            key={src}
            onClick={() => setSourceFilter(sourceFilter === src ? null : src)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '3px 4px', marginBottom: '2px', cursor: 'pointer',
              background: sourceFilter === src ? 'rgba(90,60,20,0.4)' : 'transparent',
              borderLeft: `2px solid ${sourceFilter === src ? SOURCE_COLOR[src] || '#6b4c2a' : 'transparent'}`,
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => { if (sourceFilter !== src) e.currentTarget.style.background = 'rgba(90,60,20,0.2)' }}
            onMouseLeave={e => { if (sourceFilter !== src) e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: SOURCE_COLOR[src] || '#c8a87a', textTransform: 'uppercase' }}>
              {src}
            </span>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: '#8b7355' }}>{count}</span>
          </div>
        ))}
      </PanelCard>

      {/* Right: current page items + pagination */}
      <PanelCard style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: '#8b7355', marginBottom: '3px', letterSpacing: '1px' }}>
          WARES ({displayed.length})
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {pageItems.map(s => (
            <div key={s.identifier} style={{
              fontSize: '9px', color: '#e8d5b0', padding: '3px 0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              borderBottom: '1px solid rgba(107,76,42,0.15)',
            }}>
              <span style={{ color: SOURCE_COLOR[s.trust_level === 'builtin' ? 'official' : s.source] || '#8a8a8a', marginRight: '4px', fontSize: '5px' }}>
                {(s.trust_level === 'builtin' ? 'official' : s.source).slice(0, 3).toUpperCase()}
              </span>
              {s.name}
            </div>
          ))}
        </div>
        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '3px', paddingTop: '3px', borderTop: '1px solid rgba(107,76,42,0.3)' }}>
          <button
            onClick={() => safePage > 0 && setShopPage(safePage - 1)}
            style={safePage > 0 ? btnStyle : btnDisabled}
            disabled={safePage <= 0}
          >&#9664;</button>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: '#c8a87a' }}>
            {safePage + 1} / {totalPages}
          </span>
          <button
            onClick={() => safePage < totalPages - 1 && setShopPage(safePage + 1)}
            style={safePage < totalPages - 1 ? btnStyle : btnDisabled}
            disabled={safePage >= totalPages - 1}
          >&#9654;</button>
        </div>
      </PanelCard>
      </div>
      {/* Search bar at bottom */}
      <input
        value={shopFilter}
        onChange={e => setShopFilter(e.target.value)}
        placeholder="Search skills..."
        style={{
          width: '100%', marginTop: '4px', padding: '4px 8px',
          fontFamily: 'var(--font-pixel)', fontSize: '7px',
          background: 'rgba(15,10,5,0.6)', border: '1px solid #5c3a1e',
          color: '#f0e68c', outline: 'none', boxSizing: 'border-box',
          flexShrink: 0,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#f0e68c' }}
        onBlur={e => { e.currentTarget.style.borderColor = '#5c3a1e' }}
      />
    </div>
  )
}

export default function CenterTabs() {
  const activeTab = useStore((s) => s.activeTab)
  const setActiveTab = useStore((s) => s.setActiveTab)
  const [activeNpc, setActiveNpc] = useState<string | null>(null)
  const [chatNpc, setChatNpc] = useState<string | null>(null)
  const [sceneMode, setSceneMode] = useState<'default' | 'chatter' | 'rumors'>('default')
  const [mapSelectedContinent, setMapSelectedContinent] = useState<string | null>(null)
  const knowledgeMap = useStore((s) => s.knowledgeMap)
  const [cycleLoading, setCycleLoading] = useState(false)
  const [rumors, setRumors] = useState<Array<{ id: string; text: string; author: string; handle: string; likes: number; time: string }>>([])
  const [rumorsLoading, setRumorsLoading] = useState(false)
  const [rumorsError, setRumorsError] = useState<string | null>(null)

  // Persist NPC chat history across open/close (+ localStorage)
  const chatHistoryRef = useRef<Record<string, Array<{ role: 'npc' | 'user'; text: string }>>>(
    (() => { try { const s = localStorage.getItem('hermes-npc-chat-history'); return s ? JSON.parse(s) : {} } catch { return {} } })()
  )

  // Ref for gossip refresh callback (avoids DOM querySelector hack)
  const gossipRefreshRef = useRef<(() => void) | null>(null)

  // Prefill message for "SHOW TO NPC" bag feature
  const [npcPrefill, setNpcPrefill] = useState<string | null>(null)

  // Register global bridge for SHOW TO NPC
  useEffect(() => {
    window.__hermesShowToNpc = (message: string) => {
      setActiveTab('npc')
      setNpcPrefill(message)
      // Use currently active NPC, or default to guild_master
      setChatNpc(prev => prev || 'guild_master')
      setActiveNpc(null)
    }
    return () => { window.__hermesShowToNpc = undefined }
  }, [setActiveTab])

  // Clear prefill after chat NPC changes
  useEffect(() => {
    if (!chatNpc) setNpcPrefill(null)
  }, [chatNpc])

  async function fetchRumors() {
    setRumorsLoading(true)
    setRumorsError(null)
    try {
      const res = await fetch(`${API_URL}/api/rumors/feed?max=15`)
      if (!res.ok) throw new Error(`Rumors fetch: ${res.status}`)
      const data = await res.json()
      if (data.ok) setRumors(data.rumors)
      else throw new Error('Rumors data not ok')
    } catch (e) {
      console.error('fetchRumors failed', e)
      setRumorsError('The rumor mill has gone silent...')
      setTimeout(() => setRumorsError(null), 5000)
    }
    setRumorsLoading(false)
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', gap: '0', marginBottom: '0',
        background: 'linear-gradient(to bottom, #2a1a0e, #1a120a)',
        borderBottom: '2px solid #6b4c2a',
      }}>
        {TABS.map((t) => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.color = '#c8a87a'; e.currentTarget.style.background = 'rgba(58,42,26,0.4)' } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.color = '#6a5a3a'; e.currentTarget.style.background = 'transparent' } }}
              style={{
                flex: 1,
                fontFamily: 'var(--font-pixel)',
                fontSize: '7px',
                padding: '8px 6px',
                background: isActive
                  ? 'linear-gradient(to bottom, #3a2a1a, #2a1a0e)'
                  : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #f0e68c' : '2px solid transparent',
                color: isActive ? '#f0e68c' : '#6a5a3a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s',
                letterSpacing: '1px',
              }}
            >
              <span style={{ fontSize: '10px', lineHeight: 1 }}>{t.icon}</span>
              {t.label}
            </button>
          )
        })}
      </div>
      {/* Scene — fixed ratio, pinned to top under tabs, wood frame border */}
      <div style={{
        width: '100%', aspectRatio: '1024 / 572',
        flexShrink: 0, position: 'relative', overflow: 'hidden',
        border: '2px solid #6b4c2a',
        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(160,120,60,0.15)',
        marginTop: '2px',
      }}>
        {activeTab === 'map' && <KnowledgeMap onContinentSelect={setMapSelectedContinent} />}
        {activeTab === 'guild' && <GuildPanel />}
        {activeTab === 'shop' && <Shop />}
        {activeTab === 'npc' && (
          <TavernSceneArea
            sceneMode={sceneMode}
            onSceneMode={setSceneMode}
            rumors={rumors}
            rumorsLoading={rumorsLoading}
            rumorsError={rumorsError}
            onFetchRumors={fetchRumors}
            gossipRefreshRef={gossipRefreshRef}
          />
        )}
      </div>
      {/* Bottom bar */}
      <div style={{
        flex: 1, minHeight: '80px',
        background: 'linear-gradient(180deg, #3a2515 0%, #2a1a0c 40%, #1e1208 100%)',
        border: '2px solid #6b4c2a',
        boxShadow: 'inset 0 0 0 1px rgba(160,120,60,0.15)',
        marginTop: '2px',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: '10px 14px',
        overflow: 'auto',
        position: 'relative',
      } as React.CSSProperties}>
        {/* TAVERN: NPC gallery/card/chat in bottom panel */}
        {activeTab === 'npc' && (
          <TavernNpcPanel
            activeNpc={activeNpc}
            onNpcSelect={(id) => { setActiveNpc(id); setChatNpc(null) }}
            chatNpc={chatNpc}
            onNpcChat={(id) => { setChatNpc(id); setActiveNpc(null) }}
            onCloseBio={() => setActiveNpc(null)}
            onCloseChat={() => { setChatNpc(null); setActiveNpc(null) }}
            chatHistoryRef={chatHistoryRef}
            npcPrefill={npcPrefill}
          />
        )}
        {activeTab === 'map' && (() => {
          const selected = mapSelectedContinent && knowledgeMap
            ? (knowledgeMap.continents || knowledgeMap.workflows || []).find((c) => c.id === mapSelectedContinent)
            : null
          const displayWorkflow = selected
            || (knowledgeMap ? (knowledgeMap.continents || knowledgeMap.workflows || [])[0] : null)
          if (displayWorkflow && knowledgeMap) {
            return (
              <PanelCard style={{ width: '100%', height: '100%', padding: 0, overflow: 'hidden' }}>
                <SubRegionGraph
                  continent={displayWorkflow}
                  connections={knowledgeMap.connections}
                  onBack={() => setMapSelectedContinent(null)}
                  extraAction={
                    <RpgButton onClick={async () => {
                      setCycleLoading(true)
                      try {
                        const res = await fetch(`${API_URL}/api/cycle/start`, { method: 'POST' })
                        if (res.ok) {
                          setTimeout(() => setCycleLoading(false), 2000)
                        } else {
                          setTimeout(() => setCycleLoading(false), 2000)
                        }
                      } catch {
                        setTimeout(() => setCycleLoading(false), 2000)
                      }
                    }} disabled={cycleLoading} small>
                      {cycleLoading ? '...' : '\u25B6 CYCLE'}
                    </RpgButton>
                  }
                />
              </PanelCard>
            )
          }
          return <MapBottomInfo />
        })()}
        {activeTab === 'guild' && <GuildBottomInfo />}
        {activeTab === 'shop' && <ShopBottomInfo />}
      </div>
    </div>
  )
}
