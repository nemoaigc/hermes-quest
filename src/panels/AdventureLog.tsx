import { useState } from 'react'
import { useStore } from '../store'
import { formatEvent, formatTime } from '../utils/formatters'
import { EVENT_ICONS } from '../utils/icons'
import { API_URL } from '../api'

const FEEDBACKABLE_TYPES = new Set(['skill_drop', 'cycle_end', 'quest_complete', 'train_start'])

async function sendFeedback(type: 'positive' | 'negative', event_type: string, detail: string) {
  try {
    const res = await fetch(`${API_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, event_type, detail }),
    })
    if (!res.ok) throw new Error(`Feedback failed: ${res.status}`)
    return await res.json()
  } catch (e) {
    console.error('Feedback error:', e)
  }
}

export default function AdventureLog() {
  const events = useStore((s) => s.events)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [sentFeedback, setSentFeedback] = useState<Record<string, 'positive' | 'negative'>>({})

  const handleFeedback = (key: string, type: 'positive' | 'negative', event_type: string, detail: string) => {
    setSentFeedback((prev) => ({ ...prev, [key]: type }))
    sendFeedback(type, event_type, detail)
  }

  return (
    <div className="pixel-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="pixel-panel-title" style={{ textAlign: 'center' }}>CHRONICLE</div>
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
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
            const eventKey = `${event.ts}-${event.type}-${i}`
            const canFeedback = FEEDBACKABLE_TYPES.has(type)
            const alreadySent = sentFeedback[eventKey]
            return (
              <div
                key={eventKey}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  display: 'flex', gap: '6px', alignItems: 'flex-start',
                  padding: '4px 4px 4px 8px',
                  position: 'relative',
                  marginBottom: '2px',
                }}
              >
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

                {/* Feedback buttons — only for certain event types, visible on hover */}
                {canFeedback && (
                  <div style={{
                    display: 'flex', gap: '2px', alignItems: 'center',
                    opacity: alreadySent ? 0.6 : (hoveredIdx === i ? 1 : 0),
                    transition: 'opacity 0.15s',
                    pointerEvents: alreadySent ? 'none' : 'auto',
                    flexShrink: 0,
                  }}>
                    <button
                      onClick={() => handleFeedback(eventKey, 'positive', type, text)}
                      style={{
                        background: alreadySent === 'positive' ? 'rgba(0,180,0,0.2)' : 'none',
                        border: 'none', cursor: 'pointer', padding: '1px 2px',
                        fontSize: '8px', lineHeight: 1,
                        filter: alreadySent === 'negative' ? 'grayscale(1)' : 'none',
                      }}
                      title="Good outcome"
                    >👍</button>
                    <button
                      onClick={() => handleFeedback(eventKey, 'negative', type, text)}
                      style={{
                        background: alreadySent === 'negative' ? 'rgba(180,0,0,0.2)' : 'none',
                        border: 'none', cursor: 'pointer', padding: '1px 2px',
                        fontSize: '8px', lineHeight: 1,
                        filter: alreadySent === 'positive' ? 'grayscale(1)' : 'none',
                      }}
                      title="Bad outcome"
                    >👎</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      </div>
      {events.length > 0 && (
        <div style={{
          flexShrink: 0, padding: '4px 8px',
          borderTop: '1px solid rgba(107,76,42,0.3)',
          display: 'flex', justifyContent: 'center',
        }}>
          <button onClick={() => { if (confirm('Clear all chronicle entries?')) useStore.getState().setEvents([]) }} style={{
            fontFamily: 'var(--font-pixel)', fontSize: '5px', padding: '3px 12px',
            background: 'rgba(90,60,20,0.3)', border: '1px solid rgba(139,94,60,0.4)',
            color: '#8b7355', cursor: 'pointer', letterSpacing: '1px', width: '100%',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff6b6b'; e.currentTarget.style.color = '#ff6b6b' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,94,60,0.4)'; e.currentTarget.style.color = '#8b7355' }}
          >CLEAR LOG</button>
        </div>
      )}
    </div>
  )
}
