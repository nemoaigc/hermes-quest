import { useState } from 'react'
import { useStore } from '../store'
import KnowledgeMap from './KnowledgeMap'
import GuildPanel from './GuildPanel'
import Shop from './Shop'
import type { TabId, NpcId } from '../types'

const NPCS: Array<{ id: NpcId; name: string; title: string; img: string }> = [
  { id: 'guild_master', name: 'Lyra', title: 'Guild Master', img: '/npc/guild-master.png' },
  { id: 'cartographer', name: 'Aldric', title: 'Cartographer', img: '/npc/cartographer.png' },
  { id: 'quartermaster', name: 'Kael', title: 'Quartermaster', img: '/npc/quartermaster.png' },
  { id: 'bartender' as NpcId, name: 'Rosa', title: 'Bartender', img: '/npc/bartender.png' },
  { id: 'sage' as NpcId, name: 'Orin', title: 'Sage', img: '/npc/sage.png' },
]

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'map', label: 'MAP', icon: '🗺' },
  { id: 'guild', label: 'GUILD', icon: '⚔' },
  { id: 'shop', label: 'SHOP', icon: '🏪' },
  { id: 'npc', label: 'TAVERN', icon: '🍺' },
]

/** Tavern scene — background + rumors button + floating rumors */
function TavernScene({ onRumorsClick, rumors, rumorsLoading }: {
  onRumorsClick: () => void
  rumors: Array<{ id: string; text: string; author: string; handle: string; likes: number }>
  rumorsLoading: boolean
}) {
  const showRumors = rumors.length > 0 || rumorsLoading

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <img src="/bg/npc-bg.png" alt="" draggable={false} style={{
        width: '100%', height: '100%', objectFit: 'fill',
        imageRendering: 'pixelated',
      }} />

      {/* RUMORS button — top right corner like a notice */}
      {!showRumors && (
        <button
          onClick={onRumorsClick}
          style={{
            position: 'absolute', top: '8px', right: '8px',
            fontFamily: 'var(--font-pixel)', fontSize: '7px',
            padding: '6px 14px',
            background: 'linear-gradient(180deg, #5a3a1e 0%, #3a2210 100%)',
            border: '2px solid #8b5e3c',
            color: '#f0e68c', cursor: 'pointer',
            letterSpacing: '1px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          HEAR RUMORS
        </button>
      )}

      {/* Floating rumors — scrollable whispers over the scene */}
      {showRumors && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 12px',
            background: 'rgba(58,42,26,0.9)',
            borderBottom: '2px solid #8b5e3c',
          }}>
            <span style={{
              fontFamily: 'var(--font-pixel)', fontSize: '7px',
              color: '#f0e68c', letterSpacing: '1px',
            }}>
              WHISPERS IN THE TAVERN
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={onRumorsClick} style={{
                fontFamily: 'var(--font-pixel)', fontSize: '5px',
                padding: '2px 8px', cursor: 'pointer',
                background: 'rgba(90,60,20,0.5)', border: '1px solid #5c3a1e',
                color: '#c8a87a',
              }}>REFRESH</button>
              <button onClick={() => { rumors.length = 0; }} style={{
                fontFamily: 'var(--font-pixel)', fontSize: '5px',
                padding: '2px 6px', cursor: 'pointer',
                background: 'transparent', border: '1px solid #5c3a1e',
                color: '#8b7355',
              }}>X</button>
            </div>
          </div>
          {/* Scrollable rumors list */}
          <div style={{
            flex: 1, overflow: 'auto', padding: '6px 10px',
          }}>
            {rumorsLoading ? (
              <div style={{
                textAlign: 'center', color: '#c8a87a', fontStyle: 'italic',
                fontSize: '10px', fontFamily: 'Georgia, serif',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                marginTop: '20px',
              }}>
                You lean in and listen...
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
                  fontFamily: 'Georgia, serif',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}>
                  "{r.text.length > 150 ? r.text.slice(0, 150) + '...' : r.text}"
                </div>
                <div style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '4px',
                  color: '#8b7355', marginTop: '2px',
                  display: 'flex', gap: '8px',
                }}>
                  <span>— @{r.handle}</span>
                  <span style={{ color: '#b8860b' }}>{r.likes} likes</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** TAVERN bottom — 5 NPC cells with borders, portrait fills cell */
function TavernNpcBar({ onNpcClick, activeNpc }: { onNpcClick: (id: string) => void; activeNpc: string | null }) {
  return (
    <div style={{
      display: 'flex', width: '100%', height: '100%',
    }}>
      {NPCS.map((npc, i) => {
        const isActive = activeNpc === npc.id
        return (
          <div
            key={npc.id}
            onClick={() => onNpcClick(npc.id)}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              borderRight: i < NPCS.length - 1 ? '2px solid #5c3a1e' : 'none',
              background: isActive ? 'rgba(240,230,140,0.1)' : 'transparent',
              transition: 'background 0.15s',
              padding: '4px 2px',
              overflow: 'hidden',
            }}
          >
            <img
              src={npc.img}
              alt={npc.name}
              style={{
                width: '100%', maxWidth: '80px', aspectRatio: '1',
                objectFit: 'cover',
                imageRendering: 'pixelated',
                border: isActive ? '2px solid #f0e68c' : '2px solid transparent',
                borderRadius: '2px',
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
          </div>
        )
      })}
    </div>
  )
}

/** (old RpgDialog removed — replaced by RpgDialogInline) */

/** RPG dialog inline — replaces NPC bar in the bottom area */
function RpgDialogInline({ npc, onClose }: { npc: typeof NPCS[0]; onClose: () => void }) {
  const [messages, setMessages] = useState<Array<{ role: 'npc' | 'user'; text: string }>>([
    { role: 'npc', text: npcGreeting(npc) },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const suggestions = npcSuggestions(npc)

  async function handleSend(msg?: string) {
    const text = (msg || input).trim()
    if (!text || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    setLoading(true)
    try {
      const res = await fetch('/api/npc/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ npc: npc.id, message: text, context: { active_tab: 'npc', selected_bag_items: [], selected_region: null } }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'npc', text: data.reply || '...' }])
    } catch {
      setMessages((m) => [...m, { role: 'npc', text: '*stares silently*' }])
    }
    setLoading(false)
  }

  const lastNpcMsg = [...messages].reverse().find((m) => m.role === 'npc')

  return (
    <div style={{
      display: 'flex', gap: '8px',
      width: '100%', height: '100%',
      padding: '6px 10px',
    }}>
      {/* NPC portrait */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        <img src={npc.img} alt="" style={{
          width: '56px', height: '56px', imageRendering: 'pixelated',
          border: '2px solid #8b5e3c', borderRadius: '2px',
        }} />
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: '#f0e68c' }}>{npc.name}</span>
      </div>

      {/* Dialog content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
        {/* NPC text */}
        <div style={{
          flex: 1, overflow: 'auto',
          fontSize: '10px', lineHeight: '1.5', color: '#e8d5b0',
          fontFamily: 'Georgia, serif',
        }}>
          {lastNpcMsg && (
            <span>
              <strong style={{ color: '#f0e68c', fontFamily: 'var(--font-pixel)', fontSize: '5px' }}>
                {npc.name}:
              </strong>{' '}
              {lastNpcMsg.text}
            </span>
          )}
          {loading && <span style={{ color: '#8b7355', fontStyle: 'italic' }}> ...</span>}
        </div>

        {/* Suggestions */}
        {!loading && messages.length <= 2 && (
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
            {suggestions.map((q, i) => (
              <button key={i} onClick={() => handleSend(q)} style={{
                fontFamily: 'var(--font-pixel)', fontSize: '4px',
                padding: '2px 6px', cursor: 'pointer',
                background: 'rgba(90,60,20,0.4)', border: '1px solid #5c3a1e',
                color: '#c8a87a',
              }}>{q}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Talk to ${npc.name}...`}
            disabled={loading}
            style={{
              flex: 1, padding: '3px 6px',
              background: 'rgba(10,8,4,0.6)', border: '1px solid #5c3a1e',
              color: '#e8d5b0', fontFamily: 'var(--font-mono)', fontSize: '9px',
            }}
          />
          <button onClick={() => handleSend()} disabled={loading || !input.trim()} style={{
            fontFamily: 'var(--font-pixel)', fontSize: '5px',
            padding: '3px 8px', cursor: 'pointer',
            background: '#5c3a1e', border: '2px solid #8b5e3c', color: '#f0e68c',
          }}>SEND</button>
          <button onClick={onClose} style={{
            fontFamily: 'var(--font-pixel)', fontSize: '5px',
            padding: '3px 6px', cursor: 'pointer',
            background: 'transparent', border: '1px solid #5c3a1e', color: '#8b7355',
          }}>X</button>
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

/** MAP bottom — exploration dashboard */
function MapBottomInfo() {
  const km = useStore((s) => s.knowledgeMap)
  const state = useStore((s) => s.state)
  const [cycleLoading, setCycleLoading] = useState(false)
  const workflows = km?.workflows || km?.continents || []
  const fogCount = km?.fog_regions?.length || 0
  const avgMastery = workflows.length > 0
    ? workflows.reduce((a, w) => a + ((w as any).mastery || 0), 0) / workflows.length
    : 0

  async function startCycle() {
    setCycleLoading(true)
    try {
      await fetch('/api/cycle/start', { method: 'POST' })
    } catch { /* ignore */ }
    setTimeout(() => setCycleLoading(false), 5000)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '8px',
      width: '100%', fontFamily: 'var(--font-pixel)',
    }}>
      {/* RPG stat cards row */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
        {[
          { label: 'WORKFLOWS', value: workflows.length, color: '#f0e68c' },
          { label: 'MASTERY', value: `${Math.round(avgMastery * 100)}%`, color: 'var(--cyan)' },
          { label: 'UNKNOWN', value: fogCount, color: '#8b7355' },
          { label: 'CYCLES', value: state?.total_cycles || 0, color: 'var(--green)' },
        ].map((stat) => (
          <div key={stat.label} style={{
            flex: 1, textAlign: 'center', padding: '6px 4px',
            background: 'linear-gradient(180deg, rgba(20,14,8,0.7) 0%, rgba(10,8,4,0.8) 100%)',
            border: '1px solid rgba(139,94,60,0.4)',
            borderTop: '1px solid rgba(180,140,80,0.2)',
            borderRadius: '2px',
            boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.5), 0 1px 0 rgba(139,94,60,0.15)',
          }}>
            <div style={{ fontSize: '16px', color: stat.color, fontFamily: 'var(--font-pixel)', lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '4px', color: '#8b7355', fontFamily: 'var(--font-pixel)', marginTop: '3px', letterSpacing: '0.5px' }}>
              {stat.label}
            </div>
          </div>
        ))}
        <button
          onClick={startCycle}
          disabled={cycleLoading}
          style={{
            fontFamily: 'var(--font-pixel)', fontSize: '7px',
            padding: '12px 18px', cursor: cycleLoading ? 'wait' : 'pointer',
            background: cycleLoading ? 'rgba(10,8,4,0.5)' : 'linear-gradient(180deg, #6a4428 0%, #4a2a14 50%, #3a2210 100%)',
            border: '2px solid #8b5e3c',
            borderTop: '2px solid #a07040',
            borderBottom: '2px solid #3a2010',
            color: '#f0e68c',
            letterSpacing: '1px', whiteSpace: 'nowrap',
            boxShadow: cycleLoading ? 'none' : '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,220,140,0.1)',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            transition: 'all 0.1s',
          }}
          onMouseEnter={e => { if (!cycleLoading) e.currentTarget.style.boxShadow = '0 2px 8px rgba(240,230,140,0.2), inset 0 1px 0 rgba(255,220,140,0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,220,140,0.1)' }}
        >{cycleLoading ? 'RUNNING...' : '▶ CYCLE'}</button>
      </div>
    </div>
  )
}

/** GUILD bottom — quest tracker + task input */
function GuildBottomInfo() {
  const quests = useStore((s) => s.quests)
  const [input, setInput] = useState('')
  const [creating, setCreating] = useState(false)

  const activeQuests = quests.filter((q) => q.status === 'active' || q.status === 'in_progress' || q.status === 'pending')

  async function createTask() {
    const title = input.trim()
    if (!title || creating) return
    setInput('')
    setCreating(true)
    try {
      await fetch('/api/quest/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, source: 'user' }),
      })
    } catch { /* ignore */ }
    setCreating(false)
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Header */}
      <div style={{
        fontFamily: 'var(--font-pixel)', fontSize: '7px', color: '#f0e68c',
        letterSpacing: '1px',
      }}>
        LEARNING TASKS ({activeQuests.length})
      </div>
      {/* Task list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeQuests.length === 0 ? (
          <div style={{ fontSize: '9px', color: '#6a5a3a', fontStyle: 'italic' }}>
            No active tasks. Assign one below or wait for agent recommendations.
          </div>
        ) : activeQuests.slice(0, 5).map((q) => (
          <div key={q.id} style={{
            fontSize: '9px', color: '#e8d5b0', marginBottom: '4px',
            padding: '5px 8px',
            background: 'linear-gradient(180deg, rgba(30,20,10,0.6) 0%, rgba(15,10,5,0.7) 100%)',
            border: '1px solid rgba(139,94,60,0.3)',
            borderLeft: '2px solid rgba(139,94,60,0.5)',
            borderRadius: '2px',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {q.title}
              </div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '4px', color: '#8b7355', marginTop: '1px' }}>
                {q.source === 'user' ? 'YOU' : 'AGENT'} · {q.status.toUpperCase()}
              </div>
            </div>
            <div style={{
              fontFamily: 'var(--font-pixel)', fontSize: '6px',
              color: q.progress > 0.5 ? 'var(--green)' : 'var(--cyan)',
              marginLeft: '8px',
            }}>
              {Math.round(q.progress * 100)}%
            </div>
          </div>
        ))}
      </div>
      {/* Task input */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createTask()}
          placeholder="Teach agent something new..."
          disabled={creating}
          style={{
            flex: 1, padding: '5px 8px',
            background: 'rgba(10,8,4,0.6)', border: '1px solid #5c3a1e',
            color: '#e8d5b0', fontFamily: 'var(--font-mono)', fontSize: '9px',
          }}
        />
        <button onClick={createTask} disabled={creating || !input.trim()} style={{
          fontFamily: 'var(--font-pixel)', fontSize: '6px',
          padding: '5px 12px', cursor: 'pointer',
          background: 'linear-gradient(180deg, #5c3a1e 0%, #3a2210 100%)',
          border: '2px solid #8b5e3c', color: '#f0e68c',
        }}>{creating ? '...' : 'ASSIGN'}</button>
      </div>
    </div>
  )
}

/** SHOP bottom — skill overview + recommendation hint */
function ShopBottomInfo() {
  const skills = useStore((s) => s.skills)
  const km = useStore((s) => s.knowledgeMap)
  const workflows = km?.workflows || km?.continents || []

  // Count skills by category
  const cats: Record<string, number> = {}
  skills.forEach((s) => { cats[s.category || 'other'] = (cats[s.category || 'other'] || 0) + 1 })

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '6px',
      width: '100%', fontFamily: 'var(--font-pixel)',
    }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
        <div style={{
          textAlign: 'center', padding: '6px 12px',
          background: 'rgba(10,8,4,0.5)', border: '1px solid rgba(139,94,60,0.5)',
          borderRadius: '2px',
        }}>
          <div style={{ fontSize: '18px', color: 'var(--cyan)', fontFamily: 'var(--font-pixel)', lineHeight: 1 }}>
            {skills.length}
          </div>
          <div style={{ fontSize: '4px', color: '#8b7355', fontFamily: 'var(--font-pixel)', marginTop: '3px' }}>
            TOTAL
          </div>
        </div>
        {Object.entries(cats).slice(0, 4).map(([cat, count]) => (
          <div key={cat} style={{
            flex: 1, textAlign: 'center', padding: '6px 4px',
            background: 'linear-gradient(180deg, rgba(20,14,8,0.7) 0%, rgba(10,8,4,0.8) 100%)',
            border: '1px solid rgba(139,94,60,0.4)',
            borderTop: '1px solid rgba(180,140,80,0.2)',
            borderRadius: '2px',
            boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.5), 0 1px 0 rgba(139,94,60,0.15)',
          }}>
            <div style={{ fontSize: '14px', color: '#e8d5b0', fontFamily: 'var(--font-pixel)', lineHeight: 1 }}>
              {count}
            </div>
            <div style={{ fontSize: '4px', color: '#8b7355', fontFamily: 'var(--font-pixel)', marginTop: '3px', textTransform: 'uppercase' }}>
              {cat}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CenterTabs() {
  const activeTab = useStore((s) => s.activeTab)
  const setActiveTab = useStore((s) => s.setActiveTab)
  const [activeNpc, setActiveNpc] = useState<string | null>(null)
  const selectedNpc = NPCS.find((n) => n.id === activeNpc)
  const [rumors, setRumors] = useState<Array<{ id: string; text: string; author: string; handle: string; likes: number; time: string }>>([])
  const [_rumorsOpen, setRumorsOpen] = useState(false)
  const [rumorsLoading, setRumorsLoading] = useState(false)

  async function fetchRumors() {
    setRumorsOpen(true)
    setRumorsLoading(true)
    try {
      const res = await fetch('/api/rumors/feed?max=15')
      const data = await res.json()
      if (data.ok) setRumors(data.rumors)
    } catch { /* ignore */ }
    setRumorsLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', gap: '0', marginBottom: '0',
        background: 'linear-gradient(to bottom, #2a1a0e, #1a120a)',
        borderBottom: '2px solid #5c3a1e',
      }}>
        {TABS.map((t) => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
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
        border: '3px solid #8b5e3c',
        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)',
      }}>
        {activeTab === 'map' && <KnowledgeMap />}
        {activeTab === 'guild' && <GuildPanel />}
        {activeTab === 'shop' && <Shop />}
        {activeTab === 'npc' && <TavernScene onRumorsClick={() => fetchRumors()} rumors={rumors} rumorsLoading={rumorsLoading} />}
      </div>
      {/* Bottom bar — distinct material per tab */}
      <div style={{
        flex: 1, minHeight: '80px',
        ...(activeTab === 'map' ? {
          // Cartographer's mahogany bookshelf
          background: `
            repeating-linear-gradient(90deg, transparent 0px, transparent 80px, rgba(0,0,0,0.06) 80px, rgba(0,0,0,0.06) 82px),
            linear-gradient(180deg, #3d2818 0%, #2a1c10 40%, #221608 100%)
          `,
          borderTop: '4px solid #6a4428',
          borderBottom: '2px solid #1a0e05',
          borderLeft: '3px solid #5a3a20',
          borderRight: '3px solid #5a3a20',
          boxShadow: 'inset 0 2px 0 rgba(160,112,60,0.25), inset 0 -1px 0 rgba(100,70,40,0.2), inset 0 4px 12px rgba(0,0,0,0.4)',
        } : activeTab === 'guild' ? {
          // Adventurer's oak counter
          background: `
            repeating-linear-gradient(0deg, transparent 0px, transparent 20px, rgba(120,80,40,0.04) 20px, rgba(120,80,40,0.04) 21px),
            linear-gradient(180deg, #4a3520 0%, #3a2815 40%, #2a1a0c 100%)
          `,
          borderTop: '4px solid #8b5e3c',
          borderBottom: '2px solid #1a0e05',
          borderLeft: '3px solid #6a4a2a',
          borderRight: '3px solid #6a4a2a',
          boxShadow: 'inset 0 2px 0 rgba(180,130,70,0.2), inset 0 -1px 0 rgba(100,70,40,0.15), inset 0 4px 10px rgba(0,0,0,0.35)',
        } : activeTab === 'shop' ? {
          // Alchemist's stone ledge
          background: `
            repeating-linear-gradient(45deg, transparent 0px, transparent 6px, rgba(80,60,40,0.03) 6px, rgba(80,60,40,0.03) 7px),
            repeating-linear-gradient(-45deg, transparent 0px, transparent 6px, rgba(60,40,30,0.03) 6px, rgba(60,40,30,0.03) 7px),
            linear-gradient(180deg, #352a20 0%, #2a2018 40%, #1e1610 100%)
          `,
          borderTop: '4px solid #6a5a4a',
          borderBottom: '2px solid #0e0a06',
          borderLeft: '3px solid #5a4a3a',
          borderRight: '3px solid #5a4a3a',
          boxShadow: 'inset 0 2px 0 rgba(140,120,100,0.15), inset 0 -1px 0 rgba(80,60,40,0.2), inset 0 4px 10px rgba(0,0,0,0.4)',
        } : {
          // Tavern leather bar rail
          background: `
            repeating-linear-gradient(90deg, transparent 0px, transparent 40px, rgba(100,60,30,0.05) 40px, rgba(100,60,30,0.05) 42px),
            linear-gradient(180deg, #3a2515 0%, #2d1c10 50%, #22150a 100%)
          `,
          borderTop: '4px solid #7a5030',
          borderBottom: '2px solid #1a0c04',
          borderLeft: '3px solid #6a4428',
          borderRight: '3px solid #6a4428',
          boxShadow: 'inset 0 2px 0 rgba(180,120,60,0.2), inset 0 -1px 0 rgba(120,80,40,0.15), inset 0 4px 10px rgba(0,0,0,0.35)',
        }),
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: '10px 14px',
        overflow: 'auto',
        position: 'relative',
      } as React.CSSProperties}>
        {/* Material-specific edge details */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: activeTab === 'shop'
            ? 'linear-gradient(90deg, transparent 0%, rgba(140,120,100,0.3) 20%, rgba(140,120,100,0.15) 50%, rgba(140,120,100,0.3) 80%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(200,160,100,0.2) 20%, rgba(200,160,100,0.1) 50%, rgba(200,160,100,0.2) 80%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        {activeTab === 'npc' && !selectedNpc && <TavernNpcBar onNpcClick={setActiveNpc} activeNpc={activeNpc} />}
        {activeTab === 'npc' && selectedNpc && <RpgDialogInline npc={selectedNpc} onClose={() => setActiveNpc(null)} />}
        {activeTab === 'map' && <MapBottomInfo />}
        {activeTab === 'guild' && <GuildBottomInfo />}
        {activeTab === 'shop' && <ShopBottomInfo />}
      </div>

      {/* Rumors floating overlay — shows on tavern scene */}
    </div>
  )
}
