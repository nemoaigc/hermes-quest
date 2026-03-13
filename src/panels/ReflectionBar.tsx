import { useState } from 'react'
import { useStore } from '../store'
import { API_URL } from '../api'
import { EVENT_ICONS } from '../utils/icons'

export default function ReflectionBar() {
  const [expanded, setExpanded] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const events = useStore((s) => s.events)

  const reflections = events.filter((e) => e.type === 'reflect')
  const latest = reflections[0]

  async function sendChat() {
    if (!chatMsg.trim()) return
    await fetch(`${API_URL}/api/quests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: chatMsg.trim(), description: 'Sent from dashboard chat', rank: 'C' }),
    }).catch(() => {})
    setChatMsg('')
  }

  return (
    <div className="pixel-panel">
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="pixel-panel-title" style={{ margin: 0, border: 'none', padding: 0 }}>
          REFLECTION
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
          {expanded ? '▼' : '▲'}
        </span>
      </div>
      {!expanded && latest && (
        <div style={{ fontSize: '10px', color: 'var(--purple)', marginTop: '4px' }}>
          Latest: "{(latest.data as Record<string, unknown>).chosen as string}" — analyzing weakness...
        </div>
      )}
      {expanded && (
        <div style={{ marginTop: '8px', maxHeight: '120px', overflow: 'auto' }}>
          {reflections.length === 0 ? (
            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>No reflections yet.</div>
          ) : (
            reflections.slice(0, 5).map((r, i) => (
              <div key={i} style={{ marginBottom: '6px', fontSize: '10px', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                <span style={{ width: 12, height: 12, flexShrink: 0, marginTop: '1px' }}>{EVENT_ICONS['reflect']}</span>
                <span>
                  Weaknesses: {((r.data as Record<string, unknown>).weaknesses as string[])?.join(', ')}
                  <span style={{ color: 'var(--gold)' }}> → {(r.data as Record<string, unknown>).chosen as string}</span>
                </span>
              </div>
            ))
          )}
        </div>
      )}
      <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
        <input
          value={chatMsg}
          onChange={(e) => setChatMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendChat()}
          placeholder="Send a message to Hermes..."
          style={{
            flex: 1, padding: '4px 8px',
            background: '#0a0a12', border: '1px solid var(--border)',
            color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '11px',
          }}
        />
        <button className="pixel-btn" onClick={sendChat}>SEND</button>
      </div>
    </div>
  )
}
