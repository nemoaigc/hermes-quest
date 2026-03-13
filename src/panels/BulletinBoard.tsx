import { useState } from 'react'
import { useStore } from '../store'
import { acceptQuest } from '../api'

export default function BulletinBoard() {
  const knowledgeMap = useStore((s) => s.knowledgeMap)
  const events = useStore((s) => s.events)
  const [accepting, setAccepting] = useState<string | null>(null)

  const recommendations = knowledgeMap?.recommended_quests || []

  const achievements = events.filter((e) =>
    ['level_up', 'region_unlock', 'quest_complete'].includes(e.type)
  ).slice(0, 5)

  async function handleAccept(questId: string) {
    setAccepting(questId)
    try {
      await acceptQuest(questId)
    } catch (e) {
      console.error('Failed to accept quest', e)
    }
    setAccepting(null)
  }

  const RANK_COLOR: Record<string, string> = {
    S: 'var(--gold)',
    A: 'var(--purple)',
    B: 'var(--cyan)',
    C: 'var(--green)',
    D: 'var(--text-dim)',
  }

  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-pixel)', fontSize: '7px', color: '#f0e68c',
        background: 'linear-gradient(180deg, #5c3a1e 0%, #4a2e14 100%)',
        border: '1px solid #8b5e3c', padding: '4px 8px',
        textAlign: 'center', marginBottom: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
        letterSpacing: '1px',
      }}>
        BULLETIN BOARD
      </div>

      {recommendations.length === 0 ? (
        <div style={{ fontSize: '10px', color: '#7a6a5a', textAlign: 'center', padding: '12px' }}>
          No quests available. Complete a cycle to discover new opportunities.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
          {recommendations.map((q) => (
            <div key={q.id} style={{
              padding: '6px 8px',
              background: 'linear-gradient(135deg, #1a140c 0%, #231a10 100%)',
              border: '1px solid #3a2a1a',
              cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{
                    fontFamily: 'var(--font-pixel)', fontSize: '10px',
                    color: RANK_COLOR[q.rank] || 'var(--text)',
                  }}>
                    {q.rank}
                  </span>
                  <span style={{ fontSize: '10px', color: '#e8e6f0' }}>{q.title}</span>
                </div>
                <div style={{ fontSize: '8px', color: 'var(--text-dim)' }}>
                  <span style={{ color: 'var(--gold)' }}>{q.reward_gold}G</span>
                  {' '}
                  <span style={{ color: 'var(--green)' }}>{q.reward_xp}XP</span>
                </div>
              </div>
              <div style={{ fontSize: '9px', color: '#8b7355', marginTop: '3px' }}>
                {q.description}
              </div>
              <div style={{ marginTop: '4px', display: 'flex', gap: '4px' }}>
                <button
                  className="pixel-btn"
                  onClick={() => handleAccept(q.id)}
                  disabled={accepting === q.id}
                  style={{
                    fontSize: '6px', padding: '2px 6px',
                    borderColor: '#5c3a1e', color: '#f0e68c',
                    background: 'rgba(90,60,20,0.4)',
                  }}
                >
                  {accepting === q.id ? '...' : 'ACCEPT'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {achievements.length > 0 && (
        <>
          <div style={{
            fontFamily: 'var(--font-pixel)', fontSize: '6px', color: '#8b7355',
            marginBottom: '4px', letterSpacing: '1px',
          }}>
            RECENT ACHIEVEMENTS
          </div>
          {achievements.map((e, i) => (
            <div key={`${e.ts}-${i}`} style={{
              fontSize: '9px', color: '#c8a87a',
              padding: '2px 0', borderBottom: '1px solid #1a140c',
            }}>
              {e.type === 'level_up' && `Level Up! → Lv.${(e.data as Record<string, unknown>).to}`}
              {e.type === 'region_unlock' && `New domain: ${(e.data as Record<string, unknown>).region}`}
              {e.type === 'quest_complete' && `Quest conquered: ${(e.data as Record<string, unknown>).title}`}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
