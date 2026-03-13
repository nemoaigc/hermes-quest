import { useState, useRef, useEffect } from 'react'
import { SkillIcon } from '../utils/icons'
import type { Continent, Connection, SubRegion } from '../types'

interface Props {
  continent: Continent
  connections: Connection[]
  onBack: () => void
}

export default function SubRegionGraph({ continent, connections, onBack }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 600, h: 400 })
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)

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

  const allSkills = continent.sub_regions.flatMap((sr) => sr.skills)
  const skillPositions = new Map<string, { x: number; y: number; subRegion: SubRegion }>()

  const centerX = size.w / 2
  const centerY = size.h / 2

  continent.sub_regions.forEach((sr, srIdx) => {
    const angle = (srIdx / continent.sub_regions.length) * Math.PI * 2
    const regionR = Math.min(size.w, size.h) * 0.28
    const regionCx = centerX + Math.cos(angle) * regionR
    const regionCy = centerY + Math.sin(angle) * regionR

    sr.skills.forEach((skill, skIdx) => {
      const skAngle = angle + ((skIdx - (sr.skills.length - 1) / 2) * 0.4)
      const skR = 30 + skIdx * 15
      skillPositions.set(skill, {
        x: regionCx + Math.cos(skAngle) * skR,
        y: regionCy + Math.sin(skAngle) * skR,
        subRegion: sr,
      })
    })
  })

  const localConnections = connections.filter(
    (c) => allSkills.includes(c.from) && allSkills.includes(c.to)
  )

  const selectedInfo = selectedSkill
    ? { skill: selectedSkill, ...skillPositions.get(selectedSkill)! }
    : null

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%', height: '100%',
        background: 'linear-gradient(135deg, #2a1f14 0%, #1a140c 50%, #0d0a08 100%)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.6)',
      }} />

      <div style={{
        position: 'absolute', top: 8, left: 8, zIndex: 2,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <button
          className="pixel-btn"
          onClick={onBack}
          style={{ fontSize: '6px', borderColor: '#5c3a1e', color: '#f0e68c', padding: '3px 6px' }}
        >
          BACK
        </button>
        <span style={{
          fontFamily: 'var(--font-pixel)', fontSize: '8px',
          color: continent.color, letterSpacing: '1px',
        }}>
          {continent.name}
        </span>
      </div>

      <svg width={size.w} height={size.h} style={{ position: 'absolute', inset: 0 }}>
        {continent.sub_regions.map((sr, srIdx) => {
          const angle = (srIdx / continent.sub_regions.length) * Math.PI * 2
          const regionR = Math.min(size.w, size.h) * 0.28
          const rx = centerX + Math.cos(angle) * regionR
          const ry = centerY + Math.sin(angle) * regionR - 25
          return (
            <text
              key={sr.id}
              x={rx} y={ry}
              textAnchor="middle"
              fontFamily="var(--font-pixel)"
              fontSize="5"
              fill="#8b7355"
              opacity="0.7"
            >
              {sr.name} ({Math.round(sr.mastery * 100)}%)
            </text>
          )
        })}

        {localConnections.map((c, i) => {
          const from = skillPositions.get(c.from)
          const to = skillPositions.get(c.to)
          if (!from || !to) return null
          const mx = (from.x + to.x) / 2
          const my = (from.y + to.y) / 2 - 15
          return (
            <path
              key={i}
              d={`M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`}
              fill="none"
              stroke="#5c4a2a"
              strokeWidth="1"
              strokeDasharray={c.type === 'prerequisite' ? '4 2' : 'none'}
              opacity="0.6"
            />
          )
        })}

        {Array.from(skillPositions.entries()).map(([skill, pos]) => {
          const isSelected = selectedSkill === skill
          return (
            <g
              key={skill}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => setSelectedSkill(isSelected ? null : skill)}
              style={{ cursor: 'pointer' }}
            >
              {isSelected && (
                <circle r="18" fill="none" stroke="#f0e68c" strokeWidth="1" opacity="0.5" />
              )}
              <rect x="-10" y="-10" width="20" height="20" rx="2"
                fill="#1a140c" stroke={isSelected ? '#f0e68c' : '#3a2a1a'} strokeWidth="1" />
              <foreignObject x="-8" y="-8" width="16" height="16">
                <SkillIcon name={skill} category={pos.subRegion.id} size={16} />
              </foreignObject>
              <text
                y="16" textAnchor="middle"
                fontFamily="var(--font-mono)" fontSize="3.5" fill="#c8a87a"
              >
                {skill.replace(/-/g, ' ')}
              </text>
            </g>
          )
        })}
      </svg>

      {selectedInfo && (
        <div style={{
          position: 'absolute', bottom: 8, left: 8, right: 8,
          background: 'rgba(26,20,12,0.95)', border: '1px solid #5c3a1e',
          padding: '8px', zIndex: 3,
        }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: '#f0e68c' }}>
            {selectedInfo.skill.replace(/-/g, ' ')}
          </div>
          <div style={{ fontSize: '9px', color: '#8b7355', marginTop: '4px' }}>
            Region: {selectedInfo.subRegion.name} — Mastery: {Math.round(selectedInfo.subRegion.mastery * 100)}%
          </div>
        </div>
      )}
    </div>
  )
}
