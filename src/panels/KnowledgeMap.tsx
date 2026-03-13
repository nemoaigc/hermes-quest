import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import type { Continent, FogRegion } from '../types'
import SubRegionGraph from './SubRegionGraph'

/** Generate SVG noise texture as data URL */
function useNoiseTexture() {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.createImageData(200, 200)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const v = Math.random() * 30
      imageData.data[i] = v
      imageData.data[i + 1] = v
      imageData.data[i + 2] = v
      imageData.data[i + 3] = 15
    }
    ctx.putImageData(imageData, 0, 0)
    setUrl(canvas.toDataURL())
  }, [])
  return url
}

/** Compass rose SVG */
function CompassRose() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ opacity: 0.3 }}>
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

  return (
    <g
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <polygon
        points={points.join(' ')}
        fill={continent.color}
        fillOpacity={0.25}
        stroke={continent.color}
        strokeWidth={isActive ? 2.5 : 1.5}
        strokeOpacity={0.7}
      />
      <text
        y={-r * 0.1}
        textAnchor="middle"
        fontFamily="var(--font-pixel)"
        fontSize="5"
        fill="#f0e68c"
        style={{ pointerEvents: 'none' }}
      >
        {continent.name}
      </text>
      <text
        y={r * 0.3}
        textAnchor="middle"
        fontFamily="var(--font-pixel)"
        fontSize="4"
        fill="#c8a87a"
        style={{ pointerEvents: 'none' }}
      >
        {Math.round(avgMastery * 100)}%
      </text>
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
      <circle r="30" fill="rgba(10,8,4,0.7)" stroke="#3a2a1a" strokeWidth="1" strokeDasharray="4 2" />
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
          background: 'linear-gradient(135deg, #2a1f14 0%, #1a140c 50%, #0d0a08 100%)',
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
        background: 'linear-gradient(135deg, #2a1f14 0%, #1a140c 50%, #0d0a08 100%)',
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
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.7)',
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
          const mx = (x1 + x2) / 2
          const my = (y1 + y2) / 2 - 20
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
              fill="none"
              stroke="#5c4a2a"
              strokeWidth="1.5"
              strokeDasharray="6 3"
              opacity="0.5"
            />
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
