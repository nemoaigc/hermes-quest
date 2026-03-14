import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import type { Continent, FogRegion } from '../types'
import SubRegionGraph from './SubRegionGraph'

// Sprite image mapping: continent id → sprite filename
const CONTINENT_SPRITES: Record<string, string> = {
  'software-engineering': '/sprites/continent-software-engineering.png',
  'research-knowledge': '/sprites/continent-research-knowledge.png',
  'automation-tools': '/sprites/continent-automation-tools.png',
  'creative-arts': '/sprites/continent-creative-arts.png',
}

// The parchment area within map-bg.png (1024x572)
// Measured from the actual image: parchment starts ~12% from left, ~8% from top
const PARCHMENT = { left: 14, top: 8, width: 68, height: 82 }

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
  const sprite = CONTINENT_SPRITES[continent.id]

  // Map 0-1 position to parchment area percentages
  const left = PARCHMENT.left + continent.position.x * PARCHMENT.width
  const top = PARCHMENT.top + continent.position.y * PARCHMENT.height

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
  const pos = fog.position || { x: 0.5, y: 0.5 }
  const left = PARCHMENT.left + pos.x * PARCHMENT.width
  const top = PARCHMENT.top + pos.y * PARCHMENT.height

  return (
    <div style={{
      position: 'absolute',
      left: `${left}%`,
      top: `${top}%`,
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
    }}>
      <img
        src="/sprites/fog.png"
        alt="?"
        draggable={false}
        style={{
          width: '6vmin', height: '6vmin',
          imageRendering: 'pixelated', opacity: 0.8,
        }}
      />
      <div style={{
        fontFamily: 'var(--font-pixel)', fontSize: 'clamp(4px, 0.6vmin, 6px)',
        color: '#8a7a5a',
        textShadow: '0 0 2px rgba(228,216,192,0.8)',
      }}>
        {fog.hint}
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
  function toPx(pos: { x: number; y: number }) {
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
        const p1 = toPx(cc.from.position)
        const p2 = toPx(cc.to.position)
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

  // Build cross-continent connections
  const continentConnections: Array<{ from: Continent; to: Continent }> = []
  if (knowledgeMap) {
    for (const conn of knowledgeMap.connections) {
      let fromC: Continent | undefined
      let toC: Continent | undefined
      for (const c of (knowledgeMap.continents || knowledgeMap.workflows || [])) {
        const skills: string[] = (c as any).skills_involved || (c as any).sub_regions?.flatMap((s: any) => s.skills || []) || []
        if (skills.includes(conn.from)) fromC = c
        if (skills.includes(conn.to)) toC = c
      }
      if (fromC && toC && fromC.id !== toC.id) {
        if (!continentConnections.some((cc) =>
          (cc.from.id === fromC!.id && cc.to.id === toC!.id) ||
          (cc.from.id === toC!.id && cc.to.id === fromC!.id)
        )) {
          continentConnections.push({ from: fromC, to: toC })
        }
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
      <img
        src="/bg/map-bg.png"
        alt=""
        draggable={false}
        style={{
          width: '100%', height: '100%',
          objectFit: 'fill',
          imageRendering: 'pixelated',
          position: 'absolute', inset: 0,
        }}
      />
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
          {knowledgeMap!.fog_regions.map((fog) => (
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
