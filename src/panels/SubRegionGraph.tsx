import type { Continent, Connection } from '../types'

interface Props {
  continent: Continent
  connections: Connection[]
  onBack: () => void
}

export default function SubRegionGraph({ continent, onBack }: Props) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #2a1f14 0%, #1a140c 50%, #0d0a08 100%)',
      padding: '12px',
    }}>
      <button
        className="pixel-btn"
        onClick={onBack}
        style={{ fontSize: '7px', borderColor: '#5c3a1e', color: '#f0e68c', marginBottom: '8px' }}
      >
        BACK TO ATLAS
      </button>
      <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: '#f0e68c', marginBottom: '12px' }}>
        {continent.name}
      </div>
      <div style={{ fontSize: '10px', color: '#c8a87a' }}>
        {continent.description}
      </div>
      <div style={{ marginTop: '12px' }}>
        {continent.sub_regions.map((sr) => (
          <div key={sr.id} style={{
            padding: '6px', marginBottom: '4px',
            border: '1px solid #3a2a1a', background: 'rgba(10,8,4,0.5)',
          }}>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: '#c8a87a' }}>
              {sr.name} — {Math.round(sr.mastery * 100)}%
            </div>
            <div style={{ fontSize: '9px', color: '#8a889a', marginTop: '4px' }}>
              Skills: {sr.skills.join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
