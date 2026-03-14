import { useState, useEffect, useMemo } from 'react'
import { SkillIcon } from '../utils/icons'
import { API_URL } from '../api'
import { useStore } from '../store'
import type { HubSkill } from '../store'

const SOURCE_COLOR: Record<string, string> = {
  official: 'var(--green)',
  github: 'var(--cyan)',
  'claude-marketplace': '#b48eff',
  clawhub: '#ff9944',
  lobehub: '#55bbff',
}

// 9 shelf slots — 3 rows × 3 columns aligned to shop-bg.png (1024x572)
// Cabinet: ~20%-80% width, ~22%-88% height
const SHELF_SLOTS: Array<{ left: number; top: number; width: number; height: number }> = []
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 3; col++) {
    SHELF_SLOTS.push({
      left: 21 + col * 20,
      top: 22 + row * 22,
      width: 18,
      height: 20,
    })
  }
}

function ShelfItem({ skill, slot, isSelected, onClick }: {
  skill: HubSkill
  slot: typeof SHELF_SLOTS[0]
  isSelected: boolean
  onClick: () => void
}) {
  const src = skill.trust_level === 'builtin' ? 'official' : skill.source

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${slot.left}%`, top: `${slot.top}%`,
        width: `${slot.width}%`, height: `${slot.height}%`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        background: isSelected ? 'rgba(240,230,140,0.15)' : 'transparent',
        border: isSelected ? '1px solid rgba(240,230,140,0.4)' : '1px solid transparent',
        transition: 'background 0.15s',
      }}
    >
      <SkillIcon name={skill.name} category={skill.tags[0] || 'quest'} size={22} />
      <div style={{
        fontFamily: 'var(--font-pixel)',
        fontSize: 'clamp(4px, 0.7vmin, 6px)',
        color: '#f0e68c', marginTop: '3px',
        textAlign: 'center', lineHeight: '1.2',
        maxWidth: '90%', overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
      }}>
        {skill.name}
      </div>
      <div style={{
        fontFamily: 'var(--font-pixel)',
        fontSize: 'clamp(3px, 0.5vmin, 5px)',
        color: SOURCE_COLOR[src] || '#8a8a8a',
        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
      }}>
        {src === 'official' ? 'OFFICIAL' : src.toUpperCase()}
      </div>
    </div>
  )
}

export default function Shop() {
  const setSkills = useStore((s) => s.setSkills)
  const [allSkills, setAllSkills] = useState<HubSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string | null>(null)
  const [selected, setSelected] = useState<HubSkill | null>(null)
  const [page, setPage] = useState(0)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/hub/search?q=`)
        setAllSkills(await res.json())
      } catch { setAllSkills([]) }
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

  const pageSize = 9
  const totalPages = Math.max(1, Math.ceil(displayed.length / pageSize))
  const pageItems = displayed.slice(page * pageSize, (page + 1) * pageSize)

  function srcOf(sk: HubSkill) {
    return sk.trust_level === 'builtin' ? 'official' : sk.source
  }

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
    } catch (e) { console.error('Install failed', e) }
    setInstalling(null)
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      position: 'relative', overflow: 'hidden',
    }}>
      <img src="/bg/shop-bg.png" alt="" draggable={false} style={{
        width: '100%', height: '100%',
        objectFit: 'fill', imageRendering: 'pixelated',
        position: 'absolute', inset: 0,
      }} />
      {/* Items on shelf slots */}
      {!loading && pageItems.map((skill, i) => {
        const slot = SHELF_SLOTS[i]
        if (!slot) return null
        return (
          <ShelfItem
            key={skill.identifier}
            skill={skill} slot={slot}
            isSelected={selected?.identifier === skill.identifier}
            onClick={() => setSelected(selected?.identifier === skill.identifier ? null : skill)}
          />
        )
      })}

      {loading && (
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'var(--font-pixel)', fontSize: '7px',
          color: '#f0e68c', textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        }}>
          Arranging wares...
        </div>
      )}

      {/* Search bar (top overlay) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', gap: '4px', padding: '3px 6px',
        background: 'rgba(20,12,5,0.85)',
        zIndex: 20, alignItems: 'center',
      }}>
        <input
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setSelected(null); setPage(0) }}
          placeholder="Search..."
          style={{
            flex: 1, padding: '2px 5px', minWidth: 0,
            background: '#0a0804', border: '1px solid #3a2a1a',
            color: '#c8a87a', fontFamily: 'var(--font-mono)', fontSize: '8px',
          }}
        />
        {sources.slice(0, 4).map(([src]) => (
          <button
            key={src}
            onClick={() => { setSourceFilter(sourceFilter === src ? null : src); setSelected(null); setPage(0) }}
            style={{
              fontFamily: 'var(--font-pixel)', fontSize: '5px',
              padding: '1px 4px', cursor: 'pointer',
              background: sourceFilter === src ? 'rgba(90,60,20,0.6)' : 'transparent',
              border: `1px solid ${sourceFilter === src ? SOURCE_COLOR[src] || '#8b5e3c' : '#3a2a1a'}`,
              color: SOURCE_COLOR[src] || '#c8a87a',
              opacity: sourceFilter === src ? 1 : 0.5,
            }}
          >{src.toUpperCase()}</button>
        ))}
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: '#8a7a5a' }}>
          {displayed.length}
        </span>
      </div>

      {/* Detail panel (bottom overlay) */}
      {selected && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(15,10,5,0.95)',
          borderTop: '2px solid #8b5e3c',
          padding: '8px 10px', zIndex: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <SkillIcon name={selected.name} category={selected.tags[0] || 'quest'} size={28} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: '#f0e68c' }}>
                {selected.name}
              </div>
              <div style={{ fontSize: '6px', fontFamily: 'var(--font-pixel)' }}>
                <span style={{ color: SOURCE_COLOR[srcOf(selected)] || 'var(--text-dim)' }}>
                  {srcOf(selected).toUpperCase()}
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
            fontSize: '9px', color: '#c8a87a', lineHeight: '1.3',
            marginBottom: '6px', maxHeight: '30px', overflow: 'auto',
          }}>
            {selected.description}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setSelected(null)} style={{
              fontFamily: 'var(--font-pixel)', fontSize: '6px',
              padding: '2px 8px', cursor: 'pointer',
              background: 'transparent', border: '1px solid #5c3a1e', color: '#c8a87a',
            }}>BACK</button>
            <button
              onClick={() => installSkill(selected.identifier)}
              disabled={installing === selected.identifier}
              style={{
                fontFamily: 'var(--font-pixel)', fontSize: '6px',
                padding: '2px 8px', cursor: 'pointer',
                background: 'rgba(90,60,20,0.6)', border: '1px solid #8b5e3c', color: '#f0e68c',
              }}
            >{installing === selected.identifier ? 'LEARNING...' : 'ACQUIRE SKILL'}</button>
          </div>
        </div>
      )}

      {/* Bottom bar: pagination */}
      {!selected && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '3px 8px', gap: '8px',
          background: 'rgba(20,12,5,0.85)', zIndex: 20,
        }}>
          {totalPages > 1 && (
            <>
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '7px',
                  background: 'transparent', border: 'none',
                  color: page === 0 ? '#3a2a1a' : '#f0e68c', cursor: 'pointer',
                }}
              >◀</button>
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: '#8a7a5a' }}>
                {page + 1}/{totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '7px',
                  background: 'transparent', border: 'none',
                  color: page >= totalPages - 1 ? '#3a2a1a' : '#f0e68c', cursor: 'pointer',
                }}
              >▶</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
