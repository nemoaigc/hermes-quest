import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { acceptFogQuest } from '../api'
import AnimatedBg from '../components/AnimatedBg'
import type { Continent, FogRegion } from '../types'
import SubRegionGraph from './SubRegionGraph'

// Sprite image mapping: continent id → sprite filename
const CONTINENT_SPRITES: Record<string, string> = {
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

// The parchment area within map-bg.png (1024x572)
const PARCHMENT = { left: 14, top: 8, width: 68, height: 82 }

// Fixed positions — honeycomb layout centered on parchment
// Row 1 (top):     1 site centered
// Row 2 (middle):  3 sites — left, center, right (fills the middle!)
// Row 3 (bottom):  2 sites — offset left & right
const FIXED_POSITIONS: Record<string, { x: number; y: number }> = {
  // Row 1 — top center
  'creative-arts': { x: 0.50, y: 0.15 },
  'creative-arts-flow': { x: 0.50, y: 0.15 },
  // Row 2 — middle row (3 sites, fills center)
  'software-engineering': { x: 0.22, y: 0.42 },
  'software-engineering-flow': { x: 0.22, y: 0.42 },
  'automation-tools': { x: 0.50, y: 0.45 },
  'automation-tools-flow': { x: 0.50, y: 0.45 },
  'research-knowledge': { x: 0.78, y: 0.42 },
  'research-knowledge-flow': { x: 0.78, y: 0.42 },
  // Row 3 — bottom (2 fog/sites, offset)
  'data-analytics': { x: 0.33, y: 0.75 },
  'data-analytics-flow': { x: 0.33, y: 0.75 },
  'devops-infrastructure': { x: 0.67, y: 0.75 },
  'devops-infrastructure-flow': { x: 0.67, y: 0.75 },
  // Extra slots if more workflows are discovered
  'security-defense': { x: 0.22, y: 0.75 },
  'security-defense-flow': { x: 0.22, y: 0.75 },
  'ai-machine-learning': { x: 0.78, y: 0.75 },
  'ai-machine-learning-flow': { x: 0.78, y: 0.75 },
  'web-frontend': { x: 0.50, y: 0.75 },
  'web-frontend-flow': { x: 0.50, y: 0.75 },
}

// Fog positions — match the fixed positions layout
const FOG_POSITIONS: Record<string, { x: number; y: number }> = {
  'fog-data-science': { x: 0.33, y: 0.75 },
  'fog-devops': { x: 0.67, y: 0.75 },
}
// Hidden fog IDs — don't render these
const HIDDEN_FOG = new Set<string>() // show all fog regions

function ContinentSprite({ continent, onClick, isActive }: {
  continent: Continent
  onClick: () => void
  isActive: boolean
}) {
  // v2 compat: workflows use sub_nodes + mastery + skills_involved
  const subNodes = (continent as any).sub_nodes || (continent as any).sub_regions || []
  const avgMastery = (continent as any).mastery ?? (subNodes.length > 0
    ? subNodes.reduce((a: number, s: any) => a + (s.mastery || 0), 0) / subNodes.length
    : 0)
  const skillCount = (continent as any).skills_involved?.length ?? subNodes.reduce((a: number, s: any) => a + (s.skills?.length || 0), 0)
  // Match by id directly, or strip "-flow" suffix, or match by category
  const sprite = CONTINENT_SPRITES[continent.id]
    || CONTINENT_SPRITES[continent.id.replace(/-flow$/, '')]
    || CONTINENT_SPRITES[continent.category || '']

  // Use fixed position if available, fallback to server data
  const pos = FIXED_POSITIONS[continent.id] || continent.position
  const left = PARCHMENT.left + pos.x * PARCHMENT.width
  const top = PARCHMENT.top + pos.y * PARCHMENT.height

  return (
    <div
      onClick={onClick}
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
      {sprite ? (
        <img
          src={sprite}
          alt={continent.name}
          draggable={false}
          style={{
            width: '8vmin', height: '8vmin',
            imageRendering: 'pixelated',
            filter: isActive
              ? 'brightness(1.2) drop-shadow(0 0 6px rgba(255,220,100,0.6))'
              : 'drop-shadow(1px 2px 3px rgba(0,0,0,0.4))',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        />
      ) : (
        <div style={{
          width: '8vmin', height: '8vmin',
          background: continent.color, borderRadius: '50%', opacity: 0.5,
        }} />
      )}
      <div style={{
        fontFamily: 'var(--font-pixel)', fontSize: 'clamp(5px, 0.8vmin, 8px)',
        color: '#3a1e0a', marginTop: '2px',
        textShadow: '0 0 3px rgba(228,216,192,0.9)',
        whiteSpace: 'nowrap',
      }}>
        {continent.name}
      </div>
      <div style={{
        fontFamily: 'var(--font-pixel)', fontSize: 'clamp(4px, 0.6vmin, 6px)',
        color: '#6a4a2a',
        textShadow: '0 0 2px rgba(228,216,192,0.8)',
      }}>
        {Math.round(avgMastery * 100)}% · {skillCount} skills
      </div>
    </div>
  )
}

function FogSprite({ fog }: { fog: FogRegion }) {
  const pos = FOG_POSITIONS[fog.id] || fog.position || { x: 0.9, y: 0.9 }
  const left = PARCHMENT.left + pos.x * PARCHMENT.width
  const top = PARCHMENT.top + pos.y * PARCHMENT.height
  const [exploring, setExploring] = useState(false)

  async function handleExplore() {
    if (exploring) return
    setExploring(true)
    try {
      await acceptFogQuest(fog.id)
    } catch (e) {
      console.warn('Failed to explore fog region:', e)
    }
    setExploring(false)
  }

  return (
    <div
      onClick={handleExplore}
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        cursor: exploring ? 'wait' : 'pointer',
      }}
    >
      <img
        src="/sprites/fog.png"
        alt="?"
        draggable={false}
        style={{
          width: '6vmin', height: '6vmin',
          imageRendering: 'pixelated', opacity: exploring ? 0.4 : 0.8,
          transition: 'opacity 0.3s',
        }}
      />
      <div style={{
        fontFamily: 'var(--font-pixel)', fontSize: 'clamp(4px, 0.6vmin, 6px)',
        color: '#8a7a5a',
        textShadow: '0 0 2px rgba(228,216,192,0.8)',
      }}>
        {exploring ? 'EXPLORING...' : fog.hint}
      </div>
    </div>
  )
}

/** SVG road lines between continents */
function RoadLines({ connections, containerW, containerH }: {
  connections: Array<{ from: Continent; to: Continent }>
  containerW: number
  containerH: number
}) {
  function toPx(continent: Continent) {
    const pos = FIXED_POSITIONS[continent.id] || continent.position
    return {
      x: (PARCHMENT.left + pos.x * PARCHMENT.width) / 100 * containerW,
      y: (PARCHMENT.top + pos.y * PARCHMENT.height) / 100 * containerH,
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
  const knowledgeMap = useStore((s) => s.knowledgeMap)
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null)
  const setSelectedRegion = useStore((s) => s.setSelectedRegion)
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 600, h: 400 })

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

  function handleContinentClick(id: string) {
    const newId = selectedContinent === id ? null : id
    setSelectedContinent(newId)
    setSelectedRegion(newId)
    onContinentSelect?.(newId)
  }

  // No longer switches to SubRegionGraph internally — bottom panel handles drill-down

  // Build roads between nearby continents
  const allContinents = knowledgeMap ? (knowledgeMap.continents || knowledgeMap.workflows || []) : []
  const continentConnections: Array<{ from: Continent; to: Continent }> = []
  // Connect each continent to its 2 nearest neighbors
  for (let i = 0; i < allContinents.length; i++) {
    const ci = allContinents[i]
    const pi = FIXED_POSITIONS[ci.id] || ci.position
    const dists = allContinents
      .map((cj, j) => {
        if (i === j) return { j, d: Infinity }
        const pj = FIXED_POSITIONS[cj.id] || cj.position
        return { j, d: Math.sqrt((pi.x - pj.x) ** 2 + (pi.y - pj.y) ** 2) }
      })
      .sort((a, b) => a.d - b.d)
    for (let k = 0; k < Math.min(2, dists.length); k++) {
      const cj = allContinents[dists[k].j]
      if (!continentConnections.some(cc =>
        (cc.from.id === ci.id && cc.to.id === cj.id) ||
        (cc.from.id === cj.id && cc.to.id === ci.id)
      )) {
        continentConnections.push({ from: ci, to: cj })
      }
    }
  }

  const hasData = knowledgeMap && (knowledgeMap.continents || knowledgeMap.workflows || []).length > 0

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%', height: '100%',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Background image — preserves aspect ratio, fills width */}
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
          {/* Road lines */}
          <RoadLines
            connections={continentConnections}
            containerW={size.w}
            containerH={size.h}
          />

          {/* Fog regions */}
          {knowledgeMap!.fog_regions.filter(f => !HIDDEN_FOG.has(f.id)).map((fog) => (
            <FogSprite key={fog.id} fog={fog} />
          ))}

          {/* Continent sprites */}
          {(knowledgeMap!.continents || knowledgeMap!.workflows || []).map((c) => (
            <ContinentSprite
              key={c.id}
              continent={c}
              onClick={() => handleContinentClick(c.id)}
              isActive={selectedContinent === c.id}
            />
          ))}
        </>
      )}
    </div>
  )
}
