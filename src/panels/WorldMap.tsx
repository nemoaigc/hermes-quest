import { useStore } from '../store'

// Each region maps to a real AI capability domain
const DOMAIN_INFO: Record<string, { domain: string; desc: string; color: string; icon: string }> = {
  guild:              { domain: 'Quest Hub',           desc: 'Mission control & task management', color: '#f0e68c', icon: 'HQ' },
  emerald_forest:     { domain: 'Programming',        desc: 'Code generation & syntax mastery',  color: '#66BB6A', icon: 'PRG' },
  shadow_cavern:      { domain: 'Debugging',           desc: 'Error diagnosis & troubleshooting', color: '#78909C', icon: 'DBG' },
  iron_forge:         { domain: 'Architecture',        desc: 'System design & design patterns',   color: '#90A4AE', icon: 'ARC' },
  flame_peaks:        { domain: 'Performance',         desc: 'Optimization & concurrency',        color: '#FF7043', icon: 'OPT' },
  starlight_academy:  { domain: 'AI / ML',             desc: 'Machine learning & data science',   color: '#CE93D8', icon: 'AIM' },
  abyssal_rift:       { domain: 'Advanced',            desc: 'Cross-domain & novel challenges',   color: '#AB47BC', icon: 'ADV' },
}

// Hex grid positions (col, row) for a honeycomb layout
const HEX_POS: Record<string, [number, number]> = {
  guild:             [2, 3],
  emerald_forest:    [1, 2],
  shadow_cavern:     [3, 2],
  iron_forge:        [4, 1],
  flame_peaks:       [3, 0],
  starlight_academy: [1, 0],
  abyssal_rift:      [2, 1],
}

// Connections between domains (adjacency)
const LINKS: [string, string][] = [
  ['guild', 'emerald_forest'],
  ['guild', 'shadow_cavern'],
  ['emerald_forest', 'shadow_cavern'],
  ['emerald_forest', 'starlight_academy'],
  ['shadow_cavern', 'iron_forge'],
  ['iron_forge', 'flame_peaks'],
  ['starlight_academy', 'abyssal_rift'],
  ['flame_peaks', 'abyssal_rift'],
  ['abyssal_rift', 'iron_forge'],
]

function getHexCenter(col: number, row: number, hexW: number, hexH: number, padX: number, padY: number) {
  const offsetX = row % 2 === 1 ? hexW / 2 : 0
  return {
    x: padX + col * hexW + offsetX + hexW / 2,
    y: padY + row * hexH * 0.75 + hexH / 2,
  }
}

export default function WorldMap() {
  const regions = useStore((s) => s.regions)
  const state = useStore((s) => s.state)

  const hexW = 110
  const hexH = 100
  const padX = 30
  const padY = 20
  const svgW = padX * 2 + 5.5 * hexW
  const svgH = padY * 2 + 3.5 * hexH

  // Build a lookup from regions
  const regionMap = new Map(regions.map((r) => [r.id, r]))

  // Calculate mastery % for each domain based on skills
  const skillDist = state?.skill_distribution || {}
  const domainSkillMap: Record<string, string> = {
    emerald_forest: 'coding',
    shadow_cavern: 'coding', // debugging is part of coding
    iron_forge: 'coding',
    flame_peaks: 'coding',
    starlight_academy: 'research',
    abyssal_rift: 'automation',
  }

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      background: 'linear-gradient(180deg, #0a0a12 0%, #0d0a08 50%, #0a0a12 100%)',
    }}>
      {/* Title */}
      <div style={{
        fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--gold)',
        textAlign: 'center', padding: '8px 0 4px',
        letterSpacing: '2px',
      }}>
        SKILL DOMAIN MAP
      </div>

      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto' }}>
        {/* Background grid dots */}
        <defs>
          <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.5" fill="rgba(255,255,255,0.08)" />
          </pattern>
        </defs>
        <rect width={svgW} height={svgH} fill="url(#dots)" />

        {/* Connection lines */}
        {LINKS.map(([from, to]) => {
          const p1 = HEX_POS[from]
          const p2 = HEX_POS[to]
          if (!p1 || !p2) return null
          const c1 = getHexCenter(p1[0], p1[1], hexW, hexH, padX, padY)
          const c2 = getHexCenter(p2[0], p2[1], hexW, hexH, padX, padY)
          const fromR = regionMap.get(from)
          const toR = regionMap.get(to)
          const bothUnlocked = fromR?.unlocked && toR?.unlocked
          return (
            <line
              key={`${from}-${to}`}
              x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y}
              stroke={bothUnlocked ? 'rgba(200,168,122,0.3)' : 'rgba(100,100,100,0.15)'}
              strokeWidth="2"
              strokeDasharray={bothUnlocked ? 'none' : '4,4'}
            />
          )
        })}

        {/* Domain nodes */}
        {Object.entries(HEX_POS).map(([id, [col, row]]) => {
          const center = getHexCenter(col, row, hexW, hexH, padX, padY)
          const info = DOMAIN_INFO[id]
          const region = regionMap.get(id)
          const isUnlocked = region?.unlocked ?? false
          const isCurrent = region?.current ?? false
          const isCleared = region?.cleared ?? false

          // Domain mastery progress
          const skillKey = domainSkillMap[id]
          const skillCount = skillKey ? (skillDist[skillKey] || 0) : 0
          const masteryPct = Math.min(100, (skillCount / 5) * 100) // 5 skills = 100%

          const nodeW = 90
          const nodeH = 70
          const opacity = isUnlocked ? 1 : 0.35

          return (
            <g key={id} opacity={opacity} style={{ cursor: isUnlocked ? 'pointer' : 'default' }}>
              {/* Node background */}
              <rect
                x={center.x - nodeW / 2} y={center.y - nodeH / 2}
                width={nodeW} height={nodeH}
                rx={4} ry={4}
                fill={isCurrent ? 'rgba(90,60,20,0.4)' : 'rgba(13,10,8,0.8)'}
                stroke={isCurrent ? info.color : isCleared ? 'var(--green)' : '#3a2a1a'}
                strokeWidth={isCurrent ? 2 : 1}
              />

              {/* Current indicator — pulsing border */}
              {isCurrent && (
                <rect
                  x={center.x - nodeW / 2 - 2} y={center.y - nodeH / 2 - 2}
                  width={nodeW + 4} height={nodeH + 4}
                  rx={5} ry={5}
                  fill="none"
                  stroke={info.color}
                  strokeWidth={1}
                  opacity={0.5}
                >
                  <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2s" repeatCount="indefinite" />
                </rect>
              )}

              {/* Domain abbreviation */}
              <text
                x={center.x} y={center.y - 20}
                textAnchor="middle" dominantBaseline="middle"
                fill={info.color} fontSize="12" fontFamily="var(--font-pixel)"
                opacity={isUnlocked ? 1 : 0.5}
              >
                {info.icon}
              </text>

              {/* Domain name */}
              <text
                x={center.x} y={center.y - 6}
                textAnchor="middle" dominantBaseline="middle"
                fill={isUnlocked ? '#c8a87a' : '#5a5a5a'} fontSize="9" fontFamily="var(--font-pixel)"
              >
                {info.domain}
              </text>

              {/* Mastery progress bar */}
              <rect
                x={center.x - 30} y={center.y + 8}
                width={60} height={5}
                rx={2} ry={2}
                fill="rgba(255,255,255,0.05)"
                stroke="rgba(255,255,255,0.1)" strokeWidth={0.5}
              />
              {masteryPct > 0 && (
                <rect
                  x={center.x - 30} y={center.y + 8}
                  width={60 * masteryPct / 100} height={5}
                  rx={2} ry={2}
                  fill={info.color} opacity={0.7}
                />
              )}

              {/* Status label */}
              <text
                x={center.x} y={center.y + 24}
                textAnchor="middle" dominantBaseline="middle"
                fill={isCleared ? 'var(--green)' : isCurrent ? info.color : '#5a5a5a'}
                fontSize="6" fontFamily="var(--font-pixel)"
              >
                {isCleared ? 'MASTERED' : isCurrent ? 'TRAINING' : isUnlocked ? `${Math.round(masteryPct)}%` : 'LOCKED'}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: '12px', justifyContent: 'center',
        padding: '4px 8px', flexWrap: 'wrap',
      }}>
        {Object.entries(DOMAIN_INFO).filter(([id]) => id !== 'guild').map(([id, info]) => {
          const region = regionMap.get(id)
          return (
            <div key={id} style={{
              fontSize: '7px', fontFamily: 'var(--font-pixel)',
              color: region?.unlocked ? info.color : '#3a3a3a',
              opacity: region?.unlocked ? 1 : 0.5,
            }}>
              <span style={{ color: info.color, marginRight: '3px' }}>{info.icon}</span>
              {info.desc}
            </div>
          )
        })}
      </div>
    </div>
  )
}
