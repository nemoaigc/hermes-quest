import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import type { Continent, FogRegion } from '../types'
import SubRegionGraph from './SubRegionGraph'

/** Generate parchment noise texture as data URL */
function useNoiseTexture() {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.createImageData(256, 256)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const v = Math.random()
      // Warm brownish noise for parchment feel
      imageData.data[i] = 80 + v * 40       // R: warm
      imageData.data[i + 1] = 60 + v * 30   // G: muted
      imageData.data[i + 2] = 30 + v * 20   // B: low
      imageData.data[i + 3] = 18 + Math.random() * 12 // variable alpha
    }
    ctx.putImageData(imageData, 0, 0)
    setUrl(canvas.toDataURL())
  }, [])
  return url
}

/** Compass rose SVG */
function CompassRose() {
  return (
    <svg width="48" height="48" viewBox="0 0 40 40" style={{ opacity: 0.5 }}>
      <line x1="20" y1="2" x2="20" y2="38" stroke="#8b7355" strokeWidth="0.5" />
      <line x1="2" y1="20" x2="38" y2="20" stroke="#8b7355" strokeWidth="0.5" />
      <polygon points="20,4 18,16 22,16" fill="#c8a87a" />
      <polygon points="20,36 18,24 22,24" fill="#6b5b3a" />
      <polygon points="4,20 16,18 16,22" fill="#6b5b3a" />
      <polygon points="36,20 24,18 24,22" fill="#6b5b3a" />
      <text x="20" y="3" textAnchor="middle" fontSize="4" fill="#c8a87a" fontFamily="var(--font-pixel)">N</text>
    </svg>
  )
}

/** Pixel art continent icon based on domain */
const CONTINENT_ICONS: Record<string, string[]> = {
  'software-engineering': [
    'M3,2 h10 v1 h-10z', 'M4,3 h8 v8 h-8z', 'M5,5 h2 v1 h-2z',
    'M8,5 h3 v1 h-3z', 'M5,7 h6 v1 h-6z', 'M5,9 h4 v1 h-4z',
    'M4,11 h8 v1 h-8z', 'M3,12 h10 v1 h-10z',
  ],
  'research-knowledge': [
    'M6,1 h4 v1 h-4z', 'M5,2 h6 v1 h-6z', 'M4,3 h1 v8 h-1z',
    'M11,3 h1 v8 h-1z', 'M5,3 h6 v2 h-6z', 'M6,6 h4 v1 h-4z',
    'M7,7 h2 v1 h-2z', 'M4,11 h8 v1 h-8z', 'M5,12 h6 v1 h-6z',
  ],
  'automation-tools': [
    'M7,1 h2 v2 h-2z', 'M4,3 h8 v2 h-8z', 'M3,5 h2 v4 h-2z',
    'M11,5 h2 v4 h-2z', 'M5,5 h6 v1 h-6z', 'M6,6 h4 v4 h-4z',
    'M5,10 h6 v1 h-6z', 'M4,11 h8 v2 h-8z',
  ],
  'creative-arts': [
    'M3,2 h2 v1 h-2z', 'M2,3 h1 v8 h-1z', 'M3,3 h1 v7 h-1z',
    'M6,1 h1 v3 h-1z', 'M7,2 h1 v4 h-1z', 'M9,1 h1 v5 h-1z',
    'M5,6 h6 v2 h-6z', 'M4,8 h8 v2 h-8z', 'M3,10 h10 v2 h-10z',
    'M5,12 h6 v1 h-6z',
  ],
}

/** Render an irregular blob shape for a continent */
function ContinentBlob({ continent, onClick, isActive }: {
  continent: Continent
  onClick: () => void
  isActive: boolean
}) {
  const seed = continent.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const r = continent.size * 60
  const points: string[] = []
  const n = 8
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2
    const jitter = ((seed * (i + 1) * 7) % 20 - 10) / 10
    const radius = r + jitter * r * 0.3
    points.push(`${Math.cos(angle) * radius},${Math.sin(angle) * radius}`)
  }

  const avgMastery = continent.sub_regions.length > 0
    ? continent.sub_regions.reduce((a, s) => a + s.mastery, 0) / continent.sub_regions.length
    : 0

  const iconPaths = CONTINENT_ICONS[continent.id] || CONTINENT_ICONS['software-engineering']

  return (
    <g
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Outer glow */}
      <polygon
        points={points.join(' ')}
        fill={continent.color}
        fillOpacity={0.08}
        stroke="none"
        style={{ filter: 'blur(8px)' }}
      />
      {/* Main shape */}
      <polygon
        points={points.join(' ')}
        fill={continent.color}
        fillOpacity={0.35}
        stroke={continent.color}
        strokeWidth={isActive ? 2.5 : 1.5}
        strokeOpacity={0.8}
      />
      {/* Continent icon */}
      <g transform={`translate(-8, ${-r * 0.5})`} style={{ pointerEvents: 'none' }}>
        {iconPaths.map((d, i) => (
          <path key={i} d={d} fill={continent.color} fillOpacity={0.9} />
        ))}
      </g>
      {/* Name */}
      <text
        y={r * 0.05}
        textAnchor="middle"
        fontFamily="var(--font-pixel)"
        fontSize="5"
        fill="#f0e68c"
        style={{ pointerEvents: 'none' }}
      >
        {continent.name}
      </text>
      {/* Mastery */}
      <text
        y={r * 0.35}
        textAnchor="middle"
        fontFamily="var(--font-pixel)"
        fontSize="4"
        fill="#c8a87a"
        style={{ pointerEvents: 'none' }}
      >
        {Math.round(avgMastery * 100)}%
      </text>
      {/* Skill count */}
      <text
        y={r * 0.55}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="3.5"
        fill="#8a889a"
        style={{ pointerEvents: 'none' }}
      >
        {continent.sub_regions.reduce((a, s) => a + s.skills.length, 0)} skills
      </text>
    </g>
  )
}

/** Fog of war region */
function FogBlob({ fog }: { fog: FogRegion }) {
  return (
    <g>
      <circle r="30" fill="rgba(20,15,8,0.6)" stroke="#5c4a2a" strokeWidth="1.5" strokeDasharray="4 2" />
      <text y="-4" textAnchor="middle" fontFamily="var(--font-pixel)" fontSize="8" fill="#5c5040">?</text>
      <text y="8" textAnchor="middle" fontFamily="var(--font-pixel)" fontSize="3" fill="#5c5040">{fog.hint}</text>
    </g>
  )
}

export default function KnowledgeMap() {
  const knowledgeMap = useStore((s) => s.knowledgeMap)
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null)
  const setSelectedRegion = useStore((s) => s.setSelectedRegion)
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 600, h: 400 })
  const noiseUrl = useNoiseTexture()

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setSize({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  function handleContinentClick(id: string) {
    setSelectedContinent(id)
    setSelectedRegion(id)
  }

  // Drill-down view
  if (selectedContinent && knowledgeMap) {
    const continent = knowledgeMap.continents.find((c) => c.id === selectedContinent)
    if (continent) {
      return (
        <SubRegionGraph
          continent={continent}
          connections={knowledgeMap.connections}
          onBack={() => { setSelectedContinent(null); setSelectedRegion(null) }}
        />
      )
    }
  }

  // Empty state
  if (!knowledgeMap || knowledgeMap.continents.length === 0) {
    return (
      <div
        ref={containerRef}
        style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(135deg, #5c4a32 0%, #4a3822 30%, #3d2e1c 70%, #2c2016 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}
      >
        {noiseUrl && <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${noiseUrl})`,
          backgroundRepeat: 'repeat',
          opacity: 0.5, pointerEvents: 'none',
        }} />}
        <div style={{ position: 'absolute', top: 8, right: 8 }}><CompassRose /></div>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: '#f0e68c', marginBottom: '8px' }}>
          KNOWLEDGE ATLAS
        </div>
        <div style={{ fontSize: '11px', color: '#8b7355', textAlign: 'center', maxWidth: '300px' }}>
          Begin your journey. Complete a Hermes cycle to discover your first knowledge domain.
        </div>
      </div>
    )
  }

  // Continent view
  const { w, h } = size

  const continentConnections: Array<{ from: Continent; to: Continent }> = []
  if (knowledgeMap) {
    for (const conn of knowledgeMap.connections) {
      let fromContinent: Continent | undefined
      let toContinent: Continent | undefined
      for (const c of knowledgeMap.continents) {
        const skills = c.sub_regions.flatMap((s) => s.skills)
        if (skills.includes(conn.from)) fromContinent = c
        if (skills.includes(conn.to)) toContinent = c
      }
      if (fromContinent && toContinent && fromContinent.id !== toContinent.id) {
        if (!continentConnections.some((cc) =>
          (cc.from.id === fromContinent!.id && cc.to.id === toContinent!.id) ||
          (cc.from.id === toContinent!.id && cc.to.id === fromContinent!.id)
        )) {
          continentConnections.push({ from: fromContinent, to: toContinent })
        }
      }
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%', height: '100%',
        background: 'linear-gradient(135deg, #5c4a32 0%, #4a3822 30%, #3d2e1c 70%, #2c2016 100%)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {noiseUrl && <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${noiseUrl})`,
        backgroundRepeat: 'repeat',
        opacity: 0.5, pointerEvents: 'none',
      }} />}

      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        boxShadow: 'inset 0 0 60px rgba(30,20,10,0.8), inset 0 0 120px rgba(0,0,0,0.4)',
      }} />

      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}><CompassRose /></div>

      <div style={{
        position: 'absolute', top: 8, left: 12, zIndex: 2,
        fontFamily: 'var(--font-pixel)', fontSize: '8px', color: '#c8a87a',
        letterSpacing: '2px',
      }}>
        KNOWLEDGE ATLAS
      </div>

      <svg width={w} height={h} style={{ position: 'absolute', inset: 0 }}>
        {continentConnections.map((cc, i) => {
          const x1 = cc.from.position.x * w
          const y1 = cc.from.position.y * h
          const x2 = cc.to.position.x * w
          const y2 = cc.to.position.y * h
          // Hand-drawn wobble: offset control point perpendicular to the line
          const dx = x2 - x1
          const dy = y2 - y1
          const wobble = ((i * 37 + 13) % 30) - 15 // deterministic jitter
          const mx = (x1 + x2) / 2 + dy * 0.15 + wobble
          const my = (y1 + y2) / 2 - dx * 0.15 + wobble * 0.5
          return (
            <g key={i}>
              {/* Road shadow */}
              <path
                d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                fill="none"
                stroke="#1a1208"
                strokeWidth="3"
                strokeDasharray="8 4"
                opacity="0.3"
              />
              {/* Road */}
              <path
                d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                fill="none"
                stroke="#8b7355"
                strokeWidth="1.5"
                strokeDasharray="8 4"
                opacity="0.7"
                strokeLinecap="round"
              />
              {/* Road dots at endpoints */}
              <circle cx={x1} cy={y1} r="2.5" fill="#8b7355" opacity="0.5" />
              <circle cx={x2} cy={y2} r="2.5" fill="#8b7355" opacity="0.5" />
            </g>
          )
        })}

        {knowledgeMap.fog_regions.map((fog) => (
          <g key={fog.id} transform={`translate(${fog.position.x * w}, ${fog.position.y * h})`}>
            <FogBlob fog={fog} />
          </g>
        ))}

        {knowledgeMap.continents.map((c) => (
          <g key={c.id} transform={`translate(${c.position.x * w}, ${c.position.y * h})`}>
            <ContinentBlob
              continent={c}
              onClick={() => handleContinentClick(c.id)}
              isActive={selectedContinent === c.id}
            />
          </g>
        ))}
      </svg>
    </div>
  )
}
