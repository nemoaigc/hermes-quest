import { useState } from 'react'
import { useStore } from '../store'
import { acceptQuest } from '../api'
import type { RecommendedQuest } from '../types'

// 6 parchment slot positions — mapped to bulletin-bg.png (1024x572)
// Cork board area: ~22%-78% left, ~12%-82% top
const PARCHMENT_SLOTS = [
  { left: 23, top: 12, width: 16, height: 33 },  // row 1 col 1
  { left: 41, top: 12, width: 16, height: 33 },  // row 1 col 2
  { left: 59, top: 12, width: 16, height: 33 },  // row 1 col 3
  { left: 23, top: 48, width: 16, height: 33 },  // row 2 col 1
  { left: 41, top: 48, width: 16, height: 33 },  // row 2 col 2
  { left: 59, top: 48, width: 16, height: 33 },  // row 2 col 3
]

const RANK_COLOR: Record<string, string> = {
  S: '#b8860b', A: '#6a3a8a', B: '#2a6a5a', C: '#3a6a2a', D: '#5a5a5a',
}

function QuestSlot({ quest, slot, onAccept, accepting }: {
  quest: RecommendedQuest
  slot: typeof PARCHMENT_SLOTS[0]
  onAccept: (id: string) => void
  accepting: boolean
}) {
  return (
    <div style={{
      position: 'absolute',
      left: `${slot.left}%`, top: `${slot.top}%`,
      width: `${slot.width}%`, height: `${slot.height}%`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '4% 6%',
      overflow: 'hidden',
      cursor: 'pointer',
    }}>
      {/* Rank */}
      <div style={{
        fontFamily: 'var(--font-pixel)',
        fontSize: 'clamp(5px, 0.7vw, 8px)',
        color: RANK_COLOR[quest.rank || 'C'] || '#5a5a5a',
        fontWeight: 'bold',
        lineHeight: 1,
      }}>
        [{quest.rank || 'C'}]
      </div>

      {/* Title */}
      <div style={{
        fontFamily: 'var(--font-pixel)',
        fontSize: 'clamp(4px, 0.55vw, 6px)',
        color: '#3a1e0a',
        lineHeight: '1.2',
        textAlign: 'center',
        margin: '4% 0',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        wordBreak: 'break-word',
      } as React.CSSProperties}>
        {quest.title}
      </div>

      {/* Rewards */}
      <div style={{
        fontFamily: 'var(--font-pixel)',
        fontSize: 'clamp(3px, 0.45vw, 5px)',
        color: '#6a4a2a',
      }}>
        {quest.reward_gold}G / {quest.reward_xp}XP
      </div>

      {/* Accept */}
      <button
        onClick={(e) => { e.stopPropagation(); onAccept(quest.id) }}
        disabled={accepting}
        style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: 'clamp(3px, 0.4vw, 5px)',
          padding: '1px 4px', marginTop: '4%',
          background: 'rgba(90,60,20,0.5)',
          border: '1px solid #8b6a3c',
          color: '#3a1e0a', cursor: 'pointer',
          lineHeight: 1.2,
        }}
      >
        {accepting ? '...' : 'ACCEPT'}
      </button>
    </div>
  )
}

export default function BulletinBoard() {
  const knowledgeMap = useStore((s) => s.knowledgeMap)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const recommendations = knowledgeMap?.recommended_quests || []
  const pageSize = 6
  const totalPages = Math.max(1, Math.ceil(recommendations.length / pageSize))
  const displayed = recommendations.slice(page * pageSize, (page + 1) * pageSize)

  async function handleAccept(questId: string) {
    setAccepting(questId)
    try { await acceptQuest(questId) } catch (e) { console.error(e) }
    setAccepting(null)
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      position: 'relative', overflow: 'hidden',
    }}>
      <img src="/bg/bulletin-bg.png" alt="" draggable={false} style={{
        width: '100%', height: '100%',
        objectFit: 'fill', imageRendering: 'pixelated',
        position: 'absolute', inset: 0,
      }} />
      {displayed.map((quest, i) => {
        const slot = PARCHMENT_SLOTS[i]
        if (!slot) return null
        return (
          <QuestSlot
            key={quest.id}
            quest={quest} slot={slot}
            onAccept={handleAccept}
            accepting={accepting === quest.id}
          />
        )
      })}

      {displayed.length === 0 && (
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'var(--font-pixel)',
          fontSize: 'clamp(5px, 0.8vw, 8px)',
          color: '#c8a87a',
          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          textAlign: 'center',
        }}>
          No quests posted yet.
        </div>
      )}

      {totalPages > 1 && (
        <div style={{
          position: 'absolute', bottom: '3%', left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', gap: '8px', alignItems: 'center', zIndex: 10,
        }}>
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            style={{
              fontFamily: 'var(--font-pixel)', fontSize: '7px',
              background: 'rgba(40,25,10,0.85)', border: '1px solid #8b5e3c',
              color: page === 0 ? '#5a4a3a' : '#f0e68c',
              cursor: 'pointer', padding: '2px 6px',
            }}
          >◀</button>
          <span style={{
            fontFamily: 'var(--font-pixel)', fontSize: '6px',
            color: '#f0e68c', textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          }}>{page + 1}/{totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            style={{
              fontFamily: 'var(--font-pixel)', fontSize: '7px',
              background: 'rgba(40,25,10,0.85)', border: '1px solid #8b5e3c',
              color: page >= totalPages - 1 ? '#5a4a3a' : '#f0e68c',
              cursor: 'pointer', padding: '2px 6px',
            }}
          >▶</button>
        </div>
      )}
    </div>
  )
}
