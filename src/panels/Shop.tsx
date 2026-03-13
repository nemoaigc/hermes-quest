import { useState, useEffect, useMemo } from 'react'
import { SkillIcon } from '../utils/icons'
import { API_URL } from '../websocket'
import { useStore } from '../store'
import type { HubSkill } from '../store'

const SOURCE_COLOR: Record<string, string> = {
  official: 'var(--green)',
  github: 'var(--cyan)',
  'claude-marketplace': '#b48eff',
  clawhub: '#ff9944',
  lobehub: '#55bbff',
}

/* Pixel art shopkeeper NPC */
function Shopkeeper() {
  return (
    <svg width="32" height="32" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      {/* hat */}
      <rect x="5" y="0" width="6" height="1" fill="#8b4513" />
      <rect x="3" y="1" width="10" height="1" fill="#8b4513" />
      <rect x="4" y="2" width="8" height="2" fill="#a0522d" />
      {/* face */}
      <rect x="5" y="4" width="6" height="4" fill="#deb887" />
      <rect x="6" y="5" width="1" height="1" fill="#222" />
      <rect x="9" y="5" width="1" height="1" fill="#222" />
      <rect x="7" y="7" width="2" height="1" fill="#c87050" />
      {/* body / apron */}
      <rect x="4" y="8" width="8" height="1" fill="#556b2f" />
      <rect x="3" y="9" width="10" height="4" fill="#f5f5dc" />
      <rect x="6" y="9" width="4" height="4" fill="#f0e68c" />
      <rect x="7" y="10" width="2" height="1" fill="#daa520" />
      {/* arms */}
      <rect x="2" y="9" width="1" height="3" fill="#deb887" />
      <rect x="13" y="9" width="1" height="3" fill="#deb887" />
      {/* legs */}
      <rect x="5" y="13" width="2" height="2" fill="#4a3728" />
      <rect x="9" y="13" width="2" height="2" fill="#4a3728" />
      <rect x="4" y="15" width="3" height="1" fill="#3a2a1a" />
      <rect x="9" y="15" width="3" height="1" fill="#3a2a1a" />
    </svg>
  )
}

/* Wooden shelf divider */
function Shelf() {
  return (
    <div style={{
      height: '4px', margin: '8px 0 6px',
      background: 'linear-gradient(180deg, #5c3a1e 0%, #8b5e3c 40%, #5c3a1e 100%)',
      borderTop: '1px solid #a0764a',
      borderBottom: '1px solid #3a2210',
      boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
    }} />
  )
}

/* Tavern sign style section header */
function TavernSign({ children }: { children: string }) {
  return (
    <div style={{
      fontFamily: 'var(--font-pixel)', fontSize: '7px', color: '#f0e68c',
      background: 'linear-gradient(180deg, #5c3a1e 0%, #4a2e14 100%)',
      border: '1px solid #8b5e3c', borderRadius: '2px',
      padding: '3px 8px', textAlign: 'center', marginBottom: '6px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
      letterSpacing: '1px',
    }}>
      {children}
    </div>
  )
}

const SHOPKEEPER_LINES = [
  "Welcome, adventurer! Browse my wares...",
  "Fresh skills from across the realms!",
  "Every skill makes you stronger...",
  "Take your time, I'm not going anywhere.",
  "Special stock from the Hub today!",
  "Rare finds, just for you...",
]

export default function Shop() {
  const setSkills = useStore((s) => s.setSkills)
  const [allSkills, setAllSkills] = useState<HubSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string | null>(null)
  const [selected, setSelected] = useState<HubSkill | null>(null)
  const [questTitle, setQuestTitle] = useState('')
  const [questPosting, setQuestPosting] = useState(false)
  const [questPosted, setQuestPosted] = useState<string | null>(null)

  const [greeting] = useState(() => SHOPKEEPER_LINES[Math.floor(Math.random() * SHOPKEEPER_LINES.length)])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/hub/search?q=`)
        setAllSkills(await res.json())
      } catch {
        setAllSkills([])
      }
      setLoading(false)
    })()
  }, [])

  const sources = useMemo(() => {
    const s = new Map<string, number>()
    for (const sk of allSkills) {
      const src = sk.trust_level === 'builtin' ? 'official' : sk.source
      s.set(src, (s.get(src) || 0) + 1)
    }
    return Array.from(s.entries()).sort((a, b) => b[1] - a[1])
  }, [allSkills])

  const displayed = useMemo(() => {
    let list = allSkills
    if (sourceFilter) {
      list = list.filter((s) => {
        const src = s.trust_level === 'builtin' ? 'official' : s.source
        return src === sourceFilter
      })
    }
    if (filter.trim()) {
      const q = filter.toLowerCase()
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      )
    }
    return list
  }, [allSkills, filter, sourceFilter])

  async function installSkill(identifier: string) {
    setInstalling(identifier)
    try {
      await fetch(`${API_URL}/api/hub/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      })
      const res = await fetch(`${API_URL}/api/skills`)
      setSkills(await res.json())
      setAllSkills((prev) => prev.filter((s) => s.identifier !== identifier))
      setSelected(null)
    } catch (e) {
      console.error('Install failed', e)
    }
    setInstalling(null)
  }

  async function postQuest() {
    if (!questTitle.trim()) return
    setQuestPosting(true)
    try {
      const res = await fetch(`${API_URL}/api/quests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: questTitle.trim(),
          description: `Tavern bounty: ${questTitle.trim()}`,
          rank: 'B',
          reward_gold: 50 + Math.floor(Math.random() * 100),
          reward_xp: 100 + Math.floor(Math.random() * 200),
        }),
      })
      const data = await res.json()
      setQuestPosted(data.id)
      setQuestTitle('')
      setTimeout(() => setQuestPosted(null), 3000)
    } catch (e) {
      console.error('Failed to post quest', e)
    }
    setQuestPosting(false)
  }

  function srcOf(sk: HubSkill) {
    return sk.trust_level === 'builtin' ? 'official' : sk.source
  }

  return (
    <div style={{
      background: 'linear-gradient(180deg, #0d0a08 0%, #1a120a 30%, #0d0a08 100%)',
      border: '1px solid #3a2a1a',
      padding: '6px',
      minHeight: '100%',
    }}>
      {/* Tavern header with shopkeeper */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '8px', padding: '4px 6px',
        background: 'linear-gradient(90deg, rgba(90,60,20,0.3) 0%, transparent 100%)',
        borderLeft: '2px solid #8b5e3c',
      }}>
        <Shopkeeper />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: '#f0e68c' }}>
            SKILL TAVERN
          </div>
          <div style={{
            fontSize: '9px', color: '#c8a87a', fontStyle: 'italic',
            marginTop: '2px', lineHeight: '1.3',
          }}>
            "{greeting}"
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--text-dim)' }}>
          {allSkills.length} wares
        </div>
      </div>

      {/* Source filter tabs — like tavern menu categories */}
      <div style={{ display: 'flex', gap: '3px', marginBottom: '5px', flexWrap: 'wrap' }}>
        <button
          className="pixel-btn"
          onClick={() => { setSourceFilter(null); setSelected(null) }}
          style={{
            fontSize: '6px', padding: '2px 5px',
            opacity: sourceFilter === null ? 1 : 0.4,
            borderColor: sourceFilter === null ? '#8b5e3c' : '#3a2a1a',
            background: sourceFilter === null ? 'rgba(90,60,20,0.4)' : undefined,
          }}
        >
          ALL
        </button>
        {sources.map(([src, count]) => (
          <button
            key={src}
            className="pixel-btn"
            onClick={() => { setSourceFilter(sourceFilter === src ? null : src); setSelected(null) }}
            style={{
              fontSize: '6px', padding: '2px 5px',
              color: SOURCE_COLOR[src] || 'var(--text)',
              opacity: sourceFilter === src ? 1 : 0.4,
              borderColor: sourceFilter === src ? SOURCE_COLOR[src] || '#8b5e3c' : '#3a2a1a',
              background: sourceFilter === src ? 'rgba(90,60,20,0.3)' : undefined,
            }}
          >
            {src.toUpperCase()} ({count})
          </button>
        ))}
      </div>

      {/* Search — like asking the shopkeeper */}
      <input
        value={filter}
        onChange={(e) => { setFilter(e.target.value); setSelected(null) }}
        placeholder="Ask the shopkeeper..."
        style={{
          width: '100%', padding: '3px 6px', marginBottom: '4px', boxSizing: 'border-box',
          background: '#0a0804', border: '1px solid #3a2a1a',
          color: '#c8a87a', fontFamily: 'var(--font-mono)', fontSize: '9px',
        }}
      />

      <TavernSign>{`SKILL SCROLLS  (${displayed.length})`}</TavernSign>

      {/* Detail panel — parchment style */}
      {selected ? (
        <div style={{
          padding: '8px', marginBottom: '6px',
          background: 'linear-gradient(135deg, #1a140c 0%, #231a10 100%)',
          border: '1px solid #5c3a1e',
          boxShadow: 'inset 0 0 10px rgba(90,60,20,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{
              padding: '4px', background: '#0a0804', border: '1px solid #3a2a1a',
            }}>
              <SkillIcon name={selected.name} category={selected.tags[0] || 'quest'} size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: '#f0e68c' }}>
                {selected.name}
              </div>
              <div style={{ fontSize: '7px', fontFamily: 'var(--font-pixel)' }}>
                <span style={{ color: SOURCE_COLOR[srcOf(selected)] || 'var(--text-dim)' }}>
                  {srcOf(selected) === 'official' ? 'OFFICIAL' : srcOf(selected).toUpperCase()}
                </span>
                {selected.tags.length > 0 && (
                  <span style={{ color: '#7a6a5a', marginLeft: '6px' }}>
                    {selected.tags.slice(0, 3).join(' / ')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{
            fontSize: '9px', color: '#c8a87a', lineHeight: '1.4',
            marginBottom: '8px', maxHeight: '45px', overflow: 'auto',
          }}>
            {selected.description}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="pixel-btn" onClick={() => setSelected(null)}
              style={{ fontSize: '7px', borderColor: '#5c3a1e' }}>
              BACK
            </button>
            <button
              className="pixel-btn"
              onClick={() => installSkill(selected.identifier)}
              disabled={installing === selected.identifier}
              style={{
                fontSize: '7px', color: '#f0e68c',
                borderColor: '#8b5e3c',
                background: installing === selected.identifier ? undefined : 'rgba(90,60,20,0.4)',
              }}
            >
              {installing === selected.identifier ? 'LEARNING...' : 'ACQUIRE SKILL'}
            </button>
          </div>
        </div>
      ) : null}

      {/* Skill grid — items on shelves */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#7a6a5a', fontSize: '10px', padding: '12px' }}>
          The shopkeeper is arranging wares...
        </div>
      ) : (
        <div className="skill-grid" style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))',
          maxHeight: '180px', overflow: 'auto', marginBottom: '4px',
          background: 'rgba(10,8,4,0.5)',
          border: '1px solid #2a1e12',
          padding: '4px',
        }}>
          {displayed.map((skill) => {
            const src = srcOf(skill)
            const isSelected = selected?.identifier === skill.identifier
            return (
              <div
                key={skill.identifier}
                className="skill-slot"
                title={skill.name}
                onClick={() => setSelected(isSelected ? null : skill)}
                style={{
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(140,100,40,0.2)' : '#0d0a06',
                  borderColor: isSelected ? '#f0e68c' : '#2a1e12',
                  boxShadow: isSelected ? '0 0 8px rgba(240,230,140,0.3)' : undefined,
                  position: 'relative',
                }}
              >
                <SkillIcon name={skill.name} category={skill.tags[0] || 'quest'} size={18} />
                {src === 'official' && (
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    width: 4, height: 4, borderRadius: '50%',
                    background: 'var(--green)',
                  }} />
                )}
              </div>
            )
          })}
        </div>
      )}

      <Shelf />

      <TavernSign>BOUNTY BOARD</TavernSign>

      {/* Bounty board — post quests for Hermes */}
      <div style={{
        padding: '8px',
        background: 'linear-gradient(180deg, #1a140c 0%, #0d0a06 100%)',
        border: '1px solid #2a1e12',
      }}>
        <div style={{ fontSize: '8px', color: '#7a6a5a', marginBottom: '6px' }}>
          Pin a task on the board. Hermes will pick it up on the next cycle.
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <input
            value={questTitle}
            onChange={(e) => setQuestTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && postQuest()}
            placeholder="Write a bounty..."
            style={{
              flex: 1, padding: '4px 6px',
              background: '#0a0804', border: '1px solid #3a2a1a',
              color: '#c8a87a', fontFamily: 'var(--font-mono)', fontSize: '9px',
            }}
          />
          <button
            className="pixel-btn"
            onClick={postQuest}
            disabled={questPosting || !questTitle.trim()}
            style={{
              fontSize: '7px', borderColor: '#5c3a1e',
              color: '#f0e68c',
              background: 'rgba(90,60,20,0.4)',
            }}
          >
            {questPosting ? '...' : 'POST'}
          </button>
        </div>
        {questPosted && (
          <div style={{
            marginTop: '6px', fontSize: '8px', color: 'var(--green)',
            fontFamily: 'var(--font-pixel)',
          }}>
            Bounty posted! Hermes will see it soon.
          </div>
        )}
      </div>
    </div>
  )
}
