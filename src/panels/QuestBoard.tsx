import { useState } from 'react'
import { useStore } from '../store'
import { API_URL } from '../websocket'
import { EVENT_ICONS } from '../utils/icons'

export default function QuestBoard() {
  const state = useStore((s) => s.state)
  const events = useStore((s) => s.events)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [rank, setRank] = useState('C')
  const [submitting, setSubmitting] = useState(false)

  const questEvents = events.filter((e) =>
    ['quest_accept', 'quest_complete', 'quest_fail'].includes(e.type)
  )

  async function submitQuest() {
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await fetch(`${API_URL}/api/quests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: desc.trim(), rank }),
      })
      setTitle('')
      setDesc('')
    } catch (e) {
      console.error('Failed to submit quest', e)
    }
    setSubmitting(false)
  }

  return (
    <div>
      <div className="pixel-panel-title">QUEST BOARD</div>

      <div style={{ marginBottom: '12px', padding: '8px', background: '#0a0a12', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '8px', fontFamily: 'var(--font-pixel)', color: 'var(--gold)', marginBottom: '6px' }}>
          POST A QUEST
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quest title..."
          style={{
            width: '100%', padding: '6px', marginBottom: '4px',
            background: 'var(--panel)', border: '1px solid var(--border)',
            color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '11px',
          }}
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description (optional)..."
          rows={2}
          style={{
            width: '100%', padding: '6px', marginBottom: '4px', resize: 'vertical',
            background: 'var(--panel)', border: '1px solid var(--border)',
            color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '11px',
          }}
        />
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <select
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            style={{
              padding: '4px', background: 'var(--panel)', border: '1px solid var(--border)',
              color: 'var(--text)', fontFamily: 'var(--font-pixel)', fontSize: '8px',
            }}
          >
            {['S', 'A', 'B', 'C', 'D'].map((r) => (
              <option key={r} value={r}>Rank {r}</option>
            ))}
          </select>
          <button className="pixel-btn" onClick={submitQuest} disabled={submitting || !title.trim()}>
            {submitting ? '...' : 'POST'}
          </button>
        </div>
      </div>

      {state?.active_quests && state.active_quests.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '8px', color: 'var(--cyan)', marginBottom: '4px' }}>ACTIVE</div>
          {state.active_quests.map((q) => (
            <div key={q.id} className="quest-card">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold' }}>{q.title}</span>
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '4px' }}>
                <span style={{ color: 'var(--gold)' }}>{q.reward_gold}G</span>
                {' + '}
                <span style={{ color: 'var(--green)' }}>{q.reward_xp}XP</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {questEvents.length > 0 && (
        <div>
          <div style={{ fontSize: '8px', color: 'var(--text-dim)', marginBottom: '4px' }}>HISTORY</div>
          {questEvents.slice(0, 20).map((e, i) => (
            <div key={`${e.ts}-${i}`} className="event-item">
              <span className="event-icon" style={{ width: 16, height: 16, display: 'inline-flex' }}>
                {EVENT_ICONS[e.type] || EVENT_ICONS['quest_accept']}
              </span>
              <span>{(e.data as Record<string, string>).title || (e.data as Record<string, string>).quest_id}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
