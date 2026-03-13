import { useState } from 'react'
import { useStore } from '../store'

export default function QuestTracker() {
  const quests = useStore((s) => s.quests)
  const events = useStore((s) => s.events)
  const [showHistory, setShowHistory] = useState(false)

  const activeQuests = quests.filter((q) => q.status === 'active' || q.status === 'in_progress')
  const completedEvents = events.filter((e) =>
    ['quest_complete', 'quest_fail'].includes(e.type)
  ).slice(0, 10)

  const STATUS_COLOR: Record<string, string> = {
    active: 'var(--cyan)',
    in_progress: 'var(--gold)',
    completed: 'var(--green)',
    failed: 'var(--red)',
  }

  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-pixel)', fontSize: '7px', color: '#c8a87a',
        marginBottom: '6px', letterSpacing: '1px',
      }}>
        ACTIVE QUESTS
      </div>

      {activeQuests.length === 0 ? (
        <div style={{ fontSize: '10px', color: '#7a6a5a', padding: '8px 0' }}>
          No active quests. Visit the bulletin board.
        </div>
      ) : (
        activeQuests.map((q) => (
          <div key={q.id} style={{
            padding: '6px', marginBottom: '4px',
            border: '1px solid #3a2a1a', background: 'rgba(10,8,4,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#e8e6f0' }}>{q.title}</span>
              <span style={{
                fontFamily: 'var(--font-pixel)', fontSize: '6px',
                color: STATUS_COLOR[q.status] || 'var(--text-dim)',
              }}>
                {q.status.toUpperCase()}
              </span>
            </div>
            <div style={{
              height: '6px', background: '#0a0804', border: '1px solid #3a2a1a',
              marginTop: '4px',
            }}>
              <div style={{
                height: '100%', width: `${q.progress * 100}%`,
                background: 'var(--cyan)',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ fontSize: '8px', color: 'var(--text-dim)', marginTop: '2px' }}>
              <span style={{ color: 'var(--gold)' }}>{q.reward_gold}G</span>
              {' + '}
              <span style={{ color: 'var(--green)' }}>{q.reward_xp}XP</span>
            </div>
          </div>
        ))
      )}

      {completedEvents.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div
            onClick={() => setShowHistory(!showHistory)}
            style={{
              fontFamily: 'var(--font-pixel)', fontSize: '6px', color: '#8b7355',
              cursor: 'pointer', letterSpacing: '1px',
            }}
          >
            HISTORY {showHistory ? '▼' : '▶'}
          </div>
          {showHistory && completedEvents.map((e, i) => (
            <div key={`${e.ts}-${i}`} style={{
              fontSize: '9px', padding: '2px 0',
              color: e.type === 'quest_complete' ? 'var(--green)' : 'var(--red)',
              borderBottom: '1px solid #1a140c',
            }}>
              {(e.data as Record<string, string>).title || (e.data as Record<string, string>).quest_id}
              {e.type === 'quest_complete' ? ' — COMPLETED' : ' — FAILED'}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
