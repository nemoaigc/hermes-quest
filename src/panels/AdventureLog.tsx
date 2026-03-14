import { useStore } from '../store'
import { formatEvent, formatTime } from '../utils/formatters'
import { EVENT_ICONS } from '../utils/icons'

export default function AdventureLog() {
  const events = useStore((s) => s.events)

  return (
    <div className="pixel-panel" style={{ overflow: 'auto', height: '100%' }}>
      <div className="pixel-panel-title" style={{ textAlign: 'center' }}>CHRONICLE</div>
      {events.length === 0 ? (
        <div style={{
          color: 'var(--text-dim)', fontSize: '10px', padding: '12px', textAlign: 'center',
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
        }}>
          The chronicle awaits its first entry...
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '12px' }}>
          {/* Vertical timeline line */}
          <div style={{
            position: 'absolute', left: '5px', top: 0, bottom: 0,
            width: '1px', background: 'rgba(107,76,42,0.4)',
          }} />

          {events.map((event, i) => {
            const { type, color, text } = formatEvent(event)
            return (
              <div key={`${event.ts}-${event.type}-${i}`} style={{
                display: 'flex', gap: '6px', alignItems: 'flex-start',
                padding: '4px 4px 4px 8px',
                position: 'relative',
                marginBottom: '2px',
              }}>
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute', left: '-10px', top: '6px',
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: color || 'var(--text-dim)',
                  border: '1px solid rgba(0,0,0,0.3)',
                }} />

                {/* Icon */}
                <span style={{ width: 14, height: 14, display: 'inline-flex', flexShrink: 0, marginTop: '1px' }}>
                  {EVENT_ICONS[type] || EVENT_ICONS['cycle_start']}
                </span>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '9px', color, lineHeight: '1.3' }}>{text}</div>
                  <div style={{
                    fontFamily: 'var(--font-pixel)', fontSize: '4px',
                    color: 'var(--text-dim)', marginTop: '1px',
                  }}>
                    {formatTime(event.ts)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
