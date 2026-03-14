import { useState } from 'react'
import { useStore } from '../store'
import { SkillIcon } from '../utils/icons'
import KnowledgeMap from './KnowledgeMap'
import SubRegionGraph from './SubRegionGraph'
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

/** TAVERN bottom — 5 NPC cells with embedded panel style */
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
              background: isActive
                ? 'linear-gradient(180deg, rgba(50,35,20,0.6) 0%, rgba(35,25,15,0.7) 100%)'
                : 'linear-gradient(180deg, rgba(40,28,16,0.5) 0%, rgba(28,20,12,0.6) 100%)',
              border: '1px solid rgba(139,94,60,0.3)',
              borderTop: '1px solid rgba(180,140,80,0.15)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3), 0 1px 0 rgba(139,94,60,0.1)',
              borderRadius: '2px',
              margin: '2px',
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
function RpgButton({ children, onClick, disabled, small }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; small?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: 'var(--font-pixel)', fontSize: small ? '5px' : '6px',
      padding: small ? '4px 8px' : '6px 14px',
      cursor: disabled ? 'wait' : 'pointer',
      background: disabled ? 'rgba(10,8,4,0.5)' : 'linear-gradient(180deg, #6a4428 0%, #4a2a14 50%, #3a2210 100%)',
      border: '2px solid #8b5e3c',
      borderTop: '2px solid #a07040',
      borderBottom: '2px solid #3a2010',
      color: '#f0e68c',
      boxShadow: disabled ? 'none' : '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,220,140,0.1)',
      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
      whiteSpace: 'nowrap' as const,
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

  async function startCycle() {
    setCycleLoading(true)
    try { await fetch('/api/cycle/start', { method: 'POST' }) } catch {}
    setTimeout(() => setCycleLoading(false), 5000)
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
                <div key={w.id} title={`${w.name} — ${Math.round((w.mastery || 0) * 100)}%`} style={{
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
            {fogCount > 0 && <div style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '4px', color: '#6a5a3a', fontFamily: 'var(--font-pixel)' }}>?×{fogCount}</div>}
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
          {cycleLoading ? 'EXPLORING...' : '▶ START CYCLE'}
        </RpgButton>
      </div>
    </div>
  )
}

/** GUILD bottom — two columns: task list + input & Lyra */
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
      await fetch('/api/quest/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, source: 'user' }) })
    } catch {}
    setCreating(false)
  }

  return (
    <PanelCard style={{ width: '100%', overflow: 'auto' }}>
      <div style={{ fontSize: '5px', color: '#8b7355', marginBottom: '4px', letterSpacing: '1px', fontFamily: 'var(--font-pixel)' }}>
        ACTIVE TASKS ({activeQuests.length})
      </div>
      {activeQuests.length === 0 ? (
        <div style={{ fontSize: '8px', color: '#6a5a3a', fontStyle: 'italic' }}>
          No tasks assigned. Talk to Lyra in the Tavern.
        </div>
      ) : activeQuests.slice(0, 5).map((q) => (
        <div key={q.id} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '3px', fontSize: '8px', padding: '2px 4px',
          borderLeft: '2px solid rgba(139,94,60,0.5)',
        }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ color: '#e8d5b0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</div>
            <div style={{ fontSize: '4px', color: '#8b7355', fontFamily: 'var(--font-pixel)' }}>{q.source === 'user' ? 'YOU' : 'AGENT'}</div>
          </div>
          <div style={{ width: '50px', height: '5px', background: 'rgba(10,8,4,0.6)', border: '1px solid rgba(139,94,60,0.3)', borderRadius: '1px', marginLeft: '6px' }}>
            <div style={{ height: '100%', width: `${q.progress * 100}%`, background: q.progress > 0.5 ? 'var(--green)' : 'var(--cyan)', borderRadius: '1px', transition: 'width 0.3s' }} />
          </div>
        </div>
      ))}
    </PanelCard>
  )
}

/** SHOP bottom — search + filters + skill grid */
function ShopBottomInfo() {
  const skills = useStore((s) => s.skills)
  const filter = useStore((s) => s.shopFilter)
  const sourceFilter = useStore((s) => s.shopSourceFilter)
  const setFilter = useStore((s) => s.setShopFilter)
  const setSourceFilter = useStore((s) => s.setShopSourceFilter)

  const SOURCE_COLOR: Record<string, string> = {
    official: 'var(--green)', github: 'var(--cyan)',
    'claude-marketplace': '#b48eff', clawhub: '#ff9944', lobehub: '#55bbff',
  }

  // Get unique sources from skills
  const sources = Array.from(new Set(skills.map(s => s.source || 'other')))

  return (
    <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
      {/* Search input */}
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search skills..."
        style={{
          flex: 1, padding: '6px 10px', minWidth: '100px',
          background: 'rgba(10,8,4,0.6)', border: '1px solid #5c3a1e',
          color: '#c8a87a', fontFamily: 'var(--font-mono)', fontSize: '10px',
        }}
      />
      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {sources.slice(0, 4).map((src) => (
          <button
            key={src}
            onClick={() => setSourceFilter(sourceFilter === src ? null : src)}
            style={{
              fontFamily: 'var(--font-pixel)', fontSize: '5px',
              padding: '4px 6px', cursor: 'pointer',
              background: sourceFilter === src ? 'rgba(90,60,20,0.6)' : 'transparent',
              border: `1px solid ${sourceFilter === src ? SOURCE_COLOR[src] || '#8b5e3c' : '#3a2a1a'}`,
              color: SOURCE_COLOR[src] || '#c8a87a',
              opacity: sourceFilter === src ? 1 : 0.6,
            }}
          >{src.toUpperCase()}</button>
        ))}
      </div>
      {/* Skill count */}
      <PanelCard style={{ textAlign: 'center', padding: '4px 10px' }}>
        <div style={{ fontSize: '14px', color: 'var(--cyan)', fontFamily: 'var(--font-pixel)', lineHeight: 1 }}>{skills.length}</div>
        <div style={{ fontSize: '4px', color: '#8b7355', fontFamily: 'var(--font-pixel)', marginTop: '2px' }}>SKILLS</div>
      </PanelCard>
    </div>
  )
}

export default function CenterTabs() {
  const activeTab = useStore((s) => s.activeTab)
  const setActiveTab = useStore((s) => s.setActiveTab)
  const [activeNpc, setActiveNpc] = useState<string | null>(null)
  const selectedNpc = NPCS.find((n) => n.id === activeNpc)
  const [mapSelectedContinent, setMapSelectedContinent] = useState<string | null>(null)
  const knowledgeMap = useStore((s) => s.knowledgeMap)
  const [cycleLoading, setCycleLoading] = useState(false)
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
        {activeTab === 'map' && <KnowledgeMap onContinentSelect={setMapSelectedContinent} />}
        {activeTab === 'guild' && <GuildPanel />}
        {activeTab === 'shop' && <Shop />}
        {activeTab === 'npc' && <TavernScene onRumorsClick={() => fetchRumors()} rumors={rumors} rumorsLoading={rumorsLoading} />}
      </div>
      {/* Bottom bar — distinct material per tab */}
      <div style={{
        flex: 1, minHeight: '80px',
        background: 'linear-gradient(180deg, #3a2515 0%, #2a1a0c 40%, #1e1208 100%)',
      border: '3px solid #8b5e3c',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: '10px 14px',
        overflow: 'auto',
        position: 'relative',
      } as React.CSSProperties}>
        {/* No edge line for MAP (knowledge graph fills it) */}
        {activeTab === 'npc' && !selectedNpc && <TavernNpcBar onNpcClick={setActiveNpc} activeNpc={activeNpc} />}
        {activeTab === 'npc' && selectedNpc && <RpgDialogInline npc={selectedNpc} onClose={() => setActiveNpc(null)} />}
        {activeTab === 'map' && (() => {
          const selected = mapSelectedContinent && knowledgeMap
            ? (knowledgeMap.continents || knowledgeMap.workflows || []).find((c) => c.id === mapSelectedContinent)
            : null
          const displayWorkflow = selected
            || (knowledgeMap ? (knowledgeMap.continents || knowledgeMap.workflows || [])[0] : null)
          if (displayWorkflow && knowledgeMap) {
            return (
              <div style={{ display: 'flex', width: '100%', height: '100%', gap: '8px' }}>
                {/* Knowledge graph in embedded panel */}
                <PanelCard style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
                  <SubRegionGraph
                    continent={displayWorkflow}
                    connections={knowledgeMap.connections}
                    onBack={() => setMapSelectedContinent(null)}
                  />
                </PanelCard>
                {/* Right: stats + cycle */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '120px' }}>
                  <PanelCard style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#f0e68c', fontFamily: 'var(--font-pixel)', lineHeight: 1 }}>
                      {(knowledgeMap.continents || knowledgeMap.workflows || []).length}
                    </div>
                    <div style={{ fontSize: '4px', color: '#8b7355', fontFamily: 'var(--font-pixel)', marginTop: '2px' }}>REGIONS</div>
                  </PanelCard>
                  <RpgButton onClick={() => {
                    setCycleLoading(true)
                    fetch('/api/cycle/start', { method: 'POST' }).catch(() => {})
                    setTimeout(() => setCycleLoading(false), 5000)
                  }} disabled={cycleLoading}>
                    {cycleLoading ? '...' : '▶ CYCLE'}
                  </RpgButton>
                </div>
              </div>
            )
          }
          return <MapBottomInfo />
        })()}
        {activeTab === 'guild' && <GuildBottomInfo />}
        {activeTab === 'shop' && <ShopBottomInfo />}
      </div>

      {/* Rumors floating overlay — shows on tavern scene */}
    </div>
  )
}
