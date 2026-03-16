import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { fetchSites, defineSite, renameSite, deleteSite } from '../api'
import AnimatedBg from '../components/AnimatedBg'

// Sprite image mapping: site sprite/workflow_id → sprite filename
const SPRITE_MAP: Record<string, string> = {
  'starter-town': '/sprites/continent-data-analytics.png',
  'software-engineering': '/sprites/continent-software-engineering.png',
  'research-knowledge': '/sprites/continent-research-knowledge.png',
  'automation-tools': '/sprites/continent-automation-tools.png',
  'creative-arts': '/sprites/continent-creative-arts.png',
  'data-analytics': '/sprites/continent-data-analytics.png',
  'devops-infrastructure': '/sprites/continent-devops-infrastructure.png',
  'security-defense': '/sprites/continent-security-defense.png',
  'ai-machine-learning': '/sprites/continent-ai-machine-learning.png',
  'web-frontend': '/sprites/continent-web-frontend.png',
}

// All available continent sprites (for fallback assignment)
const ALL_SPRITES = [
  '/sprites/continent-software-engineering.png',
  '/sprites/continent-research-knowledge.png',
  '/sprites/continent-automation-tools.png',
  '/sprites/continent-creative-arts.png',
  '/sprites/continent-data-analytics.png',
  '/sprites/continent-devops-infrastructure.png',
  '/sprites/continent-security-defense.png',
  '/sprites/continent-ai-machine-learning.png',
  '/sprites/continent-web-frontend.png',
]

// The parchment area within map-bg.png (1024x572)
const PARCHMENT = { left: 14, top: 8, width: 68, height: 82 }

// Fixed positions for 6 slots (honeycomb layout)
const SITE_POSITIONS: Record<string, { x: number; y: number }> = {
  'starter-town': { x: 0.52, y: 0.50 },  // center
  'site-1': { x: 0.25, y: 0.20 },        // top-left
  'site-2': { x: 0.78, y: 0.20 },        // top-right
  'site-3': { x: 0.25, y: 0.75 },        // bottom-left
  'site-4': { x: 0.78, y: 0.75 },        // bottom-right
  'site-5': { x: 0.52, y: 0.20 },        // top-center
}

type Site = {
  id: string
  name: string | null
  is_default: boolean
  defined: boolean
  domain: string | null
  workflow_id?: string | null
  sprite?: string | null
}

// Track which sprites are used to avoid duplicates
function getSpriteForSite(site: Site, allSites: Site[]): string {
  // 1. Check sprite field directly
  if (site.sprite && SPRITE_MAP[site.sprite]) return SPRITE_MAP[site.sprite]
  // 2. Check workflow_id
  if (site.workflow_id) {
    const wfKey = site.workflow_id.replace(/-flow$/, '')
    if (SPRITE_MAP[wfKey]) return SPRITE_MAP[wfKey]
  }
  // 3. Check site id
  if (SPRITE_MAP[site.id]) return SPRITE_MAP[site.id]
  // 4. Pick an unused sprite (not assigned to any other site)
  const usedSprites = new Set(allSites.filter(s => s.id !== site.id).map(s => getSpriteForSite(s, [])))
  const unused = ALL_SPRITES.filter(sp => !usedSprites.has(sp))
  if (unused.length > 0) {
    const idx = parseInt(site.id.replace(/\D/g, '') || '0', 10) % unused.length
    return unused[idx]
  }
  // 5. Final fallback
  const idx = parseInt(site.id.replace(/\D/g, '') || '0', 10) % ALL_SPRITES.length
  return ALL_SPRITES[idx]
}

function ContinentSprite({ site, allSites, skillCount, onClick, onContextMenu, isActive }: {
  site: Site
  allSites: Site[]
  skillCount: number
  onClick: () => void
  onContextMenu?: (e: React.MouseEvent) => void
  isActive: boolean
}) {
  const sprite = getSpriteForSite(site, allSites)
  const pos = SITE_POSITIONS[site.id] || { x: 0.5, y: 0.5 }
  const left = PARCHMENT.left + pos.x * PARCHMENT.width
  const top = PARCHMENT.top + pos.y * PARCHMENT.height
  const isStarter = site.id === 'starter-town'

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick() }}
      onContextMenu={onContextMenu}
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        textAlign: 'center',
        zIndex: isActive ? 10 : 1,
      }}
    >
      <img
        src={sprite}
        alt={site.name || site.id}
        draggable={false}
        style={{
          width: isStarter ? '9vmin' : '8vmin',
          height: isStarter ? '9vmin' : '8vmin',
          imageRendering: 'pixelated',
          filter: isActive
            ? 'brightness(1.2) drop-shadow(0 0 6px rgba(255,220,100,0.6))'
            : 'drop-shadow(1px 2px 3px rgba(0,0,0,0.4))',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      />
      <div style={{
        fontFamily: 'var(--font-pixel)', fontSize: 'clamp(5px, 0.8vmin, 8px)',
        color: '#3a1e0a', marginTop: '2px',
        textShadow: '0 0 3px rgba(228,216,192,0.9)',
        whiteSpace: 'nowrap',
      }}>
        {site.name || site.id} ({skillCount})
      </div>
      {isStarter && (
        <div style={{
          fontFamily: 'var(--font-pixel)', fontSize: 'clamp(5px, 0.6vmin, 6px)',
          color: '#6a4a2a',
          textShadow: '0 0 2px rgba(228,216,192,0.8)',
        }}>
          HOME
        </div>
      )}
    </div>
  )
}

function FogSiteSprite({ site, onClick, isActive }: {
  site: Site
  onClick: () => void
  isActive: boolean
}) {
  const pos = SITE_POSITIONS[site.id] || { x: 0.5, y: 0.5 }
  const left = PARCHMENT.left + pos.x * PARCHMENT.width
  const top = PARCHMENT.top + pos.y * PARCHMENT.height

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick() }}
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        cursor: 'pointer',
        zIndex: isActive ? 10 : 1,
      }}
    >
      <img
        src="/sprites/fog.png"
        alt="?"
        draggable={false}
        style={{
          width: '6vmin', height: '6vmin',
          imageRendering: 'pixelated', opacity: isActive ? 1 : 0.8,
          transition: 'opacity 0.3s',
          filter: isActive ? 'drop-shadow(0 0 6px rgba(255,220,100,0.5))' : 'none',
        }}
      />
      <div style={{
        fontFamily: 'var(--font-pixel)', fontSize: 'clamp(5px, 0.6vmin, 6px)',
        color: '#8a7a5a',
        textShadow: '0 0 2px rgba(228,216,192,0.8)',
      }}>
        ???
      </div>
    </div>
  )
}

/** SVG road lines between defined sites */
function RoadLines({ definedSites, containerW, containerH }: {
  definedSites: Site[]
  containerW: number
  containerH: number
}) {
  function toPx(site: Site) {
    const pos = SITE_POSITIONS[site.id] || { x: 0.5, y: 0.5 }
    return {
      x: (PARCHMENT.left + pos.x * PARCHMENT.width) / 100 * containerW,
      y: (PARCHMENT.top + pos.y * PARCHMENT.height) / 100 * containerH,
    }
  }

  // Connect each site to its 2 nearest neighbors
  const connections: Array<{ from: Site; to: Site }> = []
  for (let i = 0; i < definedSites.length; i++) {
    const si = definedSites[i]
    const pi = SITE_POSITIONS[si.id] || { x: 0.5, y: 0.5 }
    const dists = definedSites
      .map((sj, j) => {
        if (i === j) return { j, d: Infinity }
        const pj = SITE_POSITIONS[sj.id] || { x: 0.5, y: 0.5 }
        return { j, d: Math.sqrt((pi.x - pj.x) ** 2 + (pi.y - pj.y) ** 2) }
      })
      .sort((a, b) => a.d - b.d)
    for (let k = 0; k < Math.min(2, dists.length); k++) {
      const sj = definedSites[dists[k].j]
      if (!connections.some(cc =>
        (cc.from.id === si.id && cc.to.id === sj.id) ||
        (cc.from.id === sj.id && cc.to.id === si.id)
      )) {
        connections.push({ from: si, to: sj })
      }
    }
  }

  return (
    <svg
      width={containerW} height={containerH}
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    >
      {connections.map((cc, i) => {
        const p1 = toPx(cc.from)
        const p2 = toPx(cc.to)
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const wobble = ((i * 37 + 13) % 30) - 15
        const mx = (p1.x + p2.x) / 2 + dy * 0.15 + wobble
        const my = (p1.y + p2.y) / 2 - dx * 0.15 + wobble * 0.5
        return (
          <path
            key={i}
            d={`M ${p1.x} ${p1.y} Q ${mx} ${my} ${p2.x} ${p2.y}`}
            fill="none" stroke="#8a6a40" strokeWidth="1.5"
            strokeDasharray="6 4" opacity="0.5" strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}

export default function KnowledgeMap({ onContinentSelect }: { onContinentSelect?: (id: string | null) => void } = {}) {
  const sites = useStore((s) => s.sites)
  const setSites = useStore((s) => s.setSites)
  const knowledgeMap = useStore((s) => s.knowledgeMap)
  const [selectedSite, setSelectedSite] = useState<string | null>(null)
  const setSelectedRegion = useStore((s) => s.setSelectedRegion)
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 600, h: 400 })

  // Define / rename / delete modal state
  const [defineModal, setDefineModal] = useState<{ siteId: string } | null>(null)
  const [defineName, setDefineName] = useState('')
  const [defining, setDefining] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ siteId: string; x: number; y: number } | null>(null)
  const [renameModal, setRenameModal] = useState<{ siteId: string; currentName: string } | null>(null)
  const [renameName, setRenameName] = useState('')

  // Fetch sites on mount
  useEffect(() => {
    fetchSites()
      .then((data) => {
        const sitesArr = data.sites || data
        setSites(Array.isArray(sitesArr) ? sitesArr : [])
      })
      .catch((err) => console.warn('Failed to fetch sites:', err))
  }, [setSites])

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setSize({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight })
      }
    }
    updateSize()
    const ro = new ResizeObserver(updateSize)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  function handleSiteClick(id: string) {
    const newId = selectedSite === id ? null : id
    setSelectedSite(newId)
    setSelectedRegion(newId)
    onContinentSelect?.(newId)
  }

  async function handleDefine() {
    if (!defineModal || !defineName.trim()) return
    setDefining(true)
    try {
      await defineSite(defineModal.siteId, defineName.trim())
      // Refresh sites
      const data = await fetchSites()
      const sitesArr = data.sites || data
      setSites(Array.isArray(sitesArr) ? sitesArr : [])
      setDefineModal(null)
      setDefineName('')
    } catch (err) {
      console.error('Failed to define site:', err)
    } finally {
      setDefining(false)
    }
  }

  async function handleRename() {
    if (!renameModal || !renameName.trim()) return
    try {
      await renameSite(renameModal.siteId, renameName.trim())
      const data = await fetchSites()
      setSites(Array.isArray(data.sites || data) ? (data.sites || data) : [])
      setRenameModal(null)
      setRenameName('')
    } catch (err) { console.error('Rename failed:', err) }
  }

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  async function handleDelete(siteId: string) {
    try {
      await deleteSite(siteId)
      const data = await fetchSites()
      setSites(Array.isArray(data.sites || data) ? (data.sites || data) : [])
      setDeleteConfirm(null)
      setContextMenu(null)
    } catch (err) { console.error('Delete failed:', err) }
  }

  const definedSites = sites.filter((s) => s.defined)
  const undefinedSites = sites.filter((s) => !s.defined)
  const hasData = sites.length > 0

  return (
    <div
      ref={containerRef}
      onClick={() => { setSelectedSite(null); setSelectedRegion(null); onContinentSelect?.(null) }}
      style={{
        width: '100%', height: '100%',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Background image */}
      <AnimatedBg prefix="map" fallback="/bg/map-bg.png" style={{ position: 'absolute', inset: 0 }} />

      {/* Empty state */}
      {!hasData && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-pixel)', fontSize: '10px',
            color: '#4a2a10', marginBottom: '8px',
          }}>
            WORLD MAP
          </div>
          <div style={{
            fontSize: '11px', color: '#7a5a3a',
            textAlign: 'center', maxWidth: '300px',
          }}>
            Begin your journey. Complete a Hermes cycle to discover your first continent.
          </div>
        </div>
      )}

      {hasData && (
        <>
          {/* Road lines between defined sites */}
          <RoadLines
            definedSites={definedSites}
            containerW={size.w}
            containerH={size.h}
          />

          {/* Undefined sites (fog) */}
          {undefinedSites.map((site) => (
            <FogSiteSprite
              key={site.id}
              site={site}
              onClick={() => setDefineModal({ siteId: site.id })}
              isActive={selectedSite === site.id}
            />
          ))}

          {/* Defined sites (continents) */}
          {definedSites.map((site) => {
            const wfId = site.workflow_id
            const wf = wfId && knowledgeMap ? (knowledgeMap.workflows || []).find(w => w.id === wfId) : null
            const sc = wf ? (wf.skills_involved?.length ?? 0) : 0
            return (
              <ContinentSprite
                key={site.id}
                site={site}
                allSites={sites}
                skillCount={sc}
                onClick={() => handleSiteClick(site.id)}
                onContextMenu={site.is_default ? undefined : (e) => {
                  e.preventDefault()
                  setContextMenu({ siteId: site.id, x: e.clientX, y: e.clientY })
                }}
                isActive={selectedSite === site.id}
              />
            )
          })}
        </>
      )}

      {/* Right-click context menu */}
      {contextMenu && (
        <div onClick={() => setContextMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 9990 }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed', left: contextMenu.x, top: contextMenu.y,
              background: 'linear-gradient(180deg, #3a2a18, #2a1c0e)',
              border: '2px solid #8b6a3c', borderRadius: '6px',
              padding: '4px 0', zIndex: 9991, minWidth: '120px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
            }}
          >
            <button onClick={() => {
              const site = sites.find(s => s.id === contextMenu.siteId)
              setRenameModal({ siteId: contextMenu.siteId, currentName: site?.name || '' })
              setRenameName(site?.name || '')
              setContextMenu(null)
            }} style={{ display: 'block', width: '100%', padding: '8px 16px', textAlign: 'left', fontFamily: 'var(--font-pixel)', fontSize: '10px', color: '#e8d5b0', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(90,60,20,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >RENAME</button>
            <div style={{ height: '1px', background: 'rgba(139,106,60,0.3)', margin: '2px 8px' }} />
            <button onClick={() => { setDeleteConfirm(contextMenu.siteId); setContextMenu(null) }} style={{ display: 'block', width: '100%', padding: '8px 16px', textAlign: 'left', fontFamily: 'var(--font-pixel)', fontSize: '10px', color: '#ff6b6b', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(90,30,20,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >DELETE</button>
          </div>
        </div>
      )}

      {/* Rename modal */}
      {renameModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9990, background: 'rgba(10,8,4,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'linear-gradient(180deg, #3a2a18, #2a1c0e)', border: '2px solid #8b6a3c', borderRadius: '4px', padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: '#f0e68c', marginBottom: '12px' }}>RENAME REGION</div>
            <input autoFocus value={renameName} onChange={(e) => setRenameName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRename()} style={{ width: '200px', padding: '5px 8px', background: 'rgba(10,8,4,0.6)', border: '1px solid #5c3a1e', color: '#e8d5b0', fontFamily: 'var(--font-pixel)', fontSize: '8px', outline: 'none', marginBottom: '10px', display: 'block' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={() => setRenameModal(null)} style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', padding: '4px 12px', background: 'transparent', border: '1px solid rgba(139,94,60,0.5)', color: '#8b7355', cursor: 'pointer' }}>CANCEL</button>
              <button onClick={handleRename} disabled={!renameName.trim()} style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', padding: '4px 12px', background: 'linear-gradient(180deg, #6a4428, #3a2210)', border: '2px solid #6b4c2a', color: '#f0e68c', cursor: 'pointer', opacity: !renameName.trim() ? 0.5 : 1 }}>RENAME</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 30,
          background: 'rgba(10,8,4,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #3a2a18, #2a1c0e)',
            border: '2px solid #8b6a3c', borderRadius: '4px',
            padding: '16px 20px', textAlign: 'center', maxWidth: '260px',
          }}>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: '#ff6b6b', marginBottom: '10px' }}>
              ABANDON REGION
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '10px', color: '#c8a87a', lineHeight: '1.6', marginBottom: '14px' }}>
              Skills from this region will return to Starter Town. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                fontFamily: 'var(--font-pixel)', fontSize: '6px', padding: '5px 14px',
                background: 'transparent', border: '1px solid rgba(139,94,60,0.5)',
                color: '#8b7355', cursor: 'pointer',
              }}>NAY</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{
                fontFamily: 'var(--font-pixel)', fontSize: '6px', padding: '5px 14px',
                background: 'rgba(180,40,40,0.3)', border: '1px solid #ff6b6b',
                color: '#ff6b6b', cursor: 'pointer',
              }}>AYE, ABANDON</button>
            </div>
          </div>
        </div>
      )}

      {/* Define site modal */}
      {defineModal && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 30,
          background: 'rgba(10,8,4,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #3a2a18, #2a1c0e)',
            border: '2px solid #8b6a3c', borderRadius: '4px',
            padding: '16px 20px', textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'var(--font-pixel)', fontSize: '8px',
              color: '#f0e68c', marginBottom: '12px',
            }}>
              NAME THIS REGION
            </div>
            <input
              autoFocus
              value={defineName}
              onChange={(e) => setDefineName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDefine()}
              style={{
                width: '200px', padding: '5px 8px',
                background: 'rgba(10,8,4,0.6)',
                border: '1px solid #5c3a1e',
                color: '#e8d5b0',
                fontFamily: 'var(--font-pixel)', fontSize: '8px',
                outline: 'none', marginBottom: '10px', display: 'block',
              }}
              placeholder="e.g. Machine Learning"
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => { setDefineModal(null); setDefineName('') }}
                style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '6px',
                  padding: '4px 12px', background: 'transparent',
                  border: '1px solid rgba(139,94,60,0.5)',
                  color: '#8b7355', cursor: 'pointer',
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleDefine}
                disabled={!defineName.trim() || defining}
                style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '6px',
                  padding: '4px 12px',
                  background: 'linear-gradient(180deg, #6a4428, #3a2210)',
                  border: '2px solid #6b4c2a',
                  color: '#f0e68c', cursor: 'pointer',
                  opacity: !defineName.trim() || defining ? 0.5 : 1,
                }}
              >
                {defining ? 'DEFINING...' : 'DEFINE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
