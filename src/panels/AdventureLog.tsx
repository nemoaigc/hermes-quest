import { useStore } from '../store'
import { formatEvent, formatTime } from '../utils/formatters'
import { EVENT_ICONS } from '../utils/icons'

export default function AdventureLog() {
  const events = useStore((s) => s.events)

  return (
    <div className="pixel-panel" style={{ overflow: 'auto' }}>
      <div className="pixel-panel-title" style={{ textAlign: 'center' }}>CHRONICLE</div>
      {events.length === 0 ? (
        <div style={{ color: 'var(--text-dim)', fontSize: '10px', padding: '12px', textAlign: 'center' }}>
          No events yet. Waiting for the first quest cycle...
        </div>
      ) : (
        events.map((event, i) => {
          const { type, color, text } = formatEvent(event)
          return (
            <div key={`${event.ts}-${event.type}-${i}`} className="event-item">
              <span className="event-icon" style={{ width: 16, height: 16, display: 'inline-flex', flexShrink: 0 }}>
                {EVENT_ICONS[type] || EVENT_ICONS['cycle_start']}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ color }}>{text}</div>
                <div className="event-time">{formatTime(event.ts)}</div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
