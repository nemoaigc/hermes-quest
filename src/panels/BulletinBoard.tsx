import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { acceptQuest, fetchMap, fetchActiveQuests } from '../api'
import AnimatedBg from '../components/AnimatedBg'
import type { RecommendedQuest } from '../types'

// 6 parchment slot positions — pixel-measured from bulletin-bg.png (1024x572)
// Parchment cols: 30.3-39.7%, 45.2-54.8%, 60.3-69.7%
// Parchment rows: 25.9-48.4%, 52.3-75.0%
const PARCHMENT_SLOTS = [
  { left: 30.3, top: 25.9, width: 9.4, height: 22.5 },  // row 1 col 1
  { left: 45.2, top: 25.9, width: 9.6, height: 22.5 },  // row 1 col 2
  { left: 60.3, top: 25.9, width: 9.4, height: 22.5 },  // row 1 col 3
  { left: 30.3, top: 52.3, width: 9.4, height: 22.7 },  // row 2 col 1
  { left: 45.2, top: 52.3, width: 9.6, height: 22.7 },  // row 2 col 2
  { left: 60.3, top: 52.3, width: 9.4, height: 22.7 },  // row 2 col 3
]

const RANK_COLOR: Record<string, string> = {
  S: '#6b4c2a', A: '#6a3a8a', B: '#2a6a5a', C: '#3a6a2a', D: '#5a5a5a',
}

function abbrev(title: string, max = 10): string {
  if (title.length <= max) return title
  return title.slice(0, max) + '...'
}

function QuestSlot({ quest, slot, onAccept, accepting, onSelect, selected }: {
  quest: RecommendedQuest
  slot: typeof PARCHMENT_SLOTS[0]
  onAccept: (id: string) => void
  accepting: boolean
  onSelect: (id: string) => void
  selected: boolean
}) {
  return (
    <div
      title={`${quest.title}\n${quest.description || ''}`}
      onClick={() => onSelect(quest.id)}
      style={{
        position: 'absolute',
        left: `${slot.left}%`, top: `${slot.top}%`,
        width: `${slot.width}%`, height: `${slot.height}%`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '3% 4%',
        overflow: 'hidden',
        cursor: 'pointer',
        outline: selected ? '2px solid #f0e68c' : 'none',
        outlineOffset: '-1px',
        borderRadius: '2px',
      }}>
      {/* Rank */}
      <div style={{
        fontFamily: 'var(--font-pixel)',
        fontSize: 'clamp(5px, 0.55vw, 7px)',
        color: RANK_COLOR[quest.rank || 'C'] || '#5a5a5a',
        fontWeight: 'bold',
        lineHeight: 1,
        textAlign: 'center',
      }}>
        [{quest.rank || 'C'}]
      </div>

      {/* Title — abbreviated to prevent one-letter-per-line */}
      <div style={{
        fontFamily: 'var(--font-pixel)',
        fontSize: 'clamp(5px, 0.45vw, 5px)',
        color: '#3a1e0a',
        lineHeight: '1.2',
        textAlign: 'center',
        margin: '2% 0',
        width: '100%',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      }}>
        {abbrev(quest.title, 10)}
      </div>

      {/* Rewards */}
      <div style={{
        fontFamily: 'var(--font-pixel)',
        fontSize: 'clamp(5px, 0.4vw, 5px)',
        color: '#6a4a2a',
        textAlign: 'center',
        lineHeight: '1.2',
      }}>
        <div>{quest.reward_gold ?? 0}G</div>
        <div>{quest.reward_xp ?? 0}XP</div>
      </div>

      {/* Accept */}
      <button
        onClick={(e) => { e.stopPropagation(); onAccept(quest.id) }}
        disabled={accepting}
        style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: 'clamp(5px, 0.4vw, 5px)',
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

/** Expanded detail overlay for a selected quest */
function QuestDetailOverlay({ quest, onClose, onAccept, accepting, acceptError }: {
  quest: RecommendedQuest
  onClose: () => void
  onAccept: (id: string) => void
  accepting: boolean
  acceptError?: string | null
}) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClose() }}
      style={{
        position: 'absolute', inset: 0, zIndex: 20,
        background: 'rgba(10,8,4,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #3a2a18 0%, #2a1c0e 100%)',
          border: '2px solid #8b6a3c',
          borderRadius: '4px',
          padding: '14px 18px',
          maxWidth: '70%',
          maxHeight: '80%',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          cursor: 'default',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{
            fontFamily: 'var(--font-pixel)', fontSize: 'clamp(6px, 0.8vw, 10px)',
            color: RANK_COLOR[quest.rank || 'C'] || '#5a5a5a',
            fontWeight: 'bold',
          }}>
            [{quest.rank || 'C'}]
          </span>
          <span style={{
            fontFamily: 'var(--font-pixel)', fontSize: 'clamp(6px, 0.8vw, 10px)',
            color: '#f0e68c',
          }}>
            {quest.title}
          </span>
        </div>
        {quest.description && (
          <div style={{
            fontSize: 'clamp(8px, 1vw, 12px)',
            color: '#c8a87a',
            lineHeight: '1.5',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            marginBottom: '10px',
          }}>
            {quest.description}
          </div>
        )}
        <div style={{
          display: 'flex', gap: '12px', alignItems: 'center',
          fontFamily: 'var(--font-pixel)', fontSize: 'clamp(5px, 0.6vw, 8px)',
          color: '#8b7355',
        }}>
          <span>{quest.reward_gold}G / {quest.reward_xp}XP</span>
          {quest.region && <span>Region: {quest.region}</span>}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              fontFamily: 'var(--font-pixel)', fontSize: 'clamp(5px, 0.6vw, 7px)',
              padding: '4px 12px', cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(139,94,60,0.5)',
              color: '#8b7355',
            }}
          >CLOSE</button>
          <button
            onClick={() => onAccept(quest.id)}
            disabled={accepting}
            style={{
              fontFamily: 'var(--font-pixel)', fontSize: 'clamp(5px, 0.6vw, 7px)',
              padding: '4px 12px', cursor: 'pointer',
              background: 'linear-gradient(180deg, #6a4428 0%, #4a2a14 50%, #3a2210 100%)',
              border: '2px solid #6b4c2a',
              color: '#f0e68c',
              boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
            }}
          >{accepting ? '...' : 'ACCEPT QUEST'}</button>
        </div>
        {acceptError && (
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 'clamp(5px, 0.6vw, 7px)', color: '#ff6b6b', marginTop: '6px' }}>
            {acceptError}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BulletinBoard() {
  const knowledgeMap = useStore((s) => s.knowledgeMap)
  const setKnowledgeMap = useStore((s) => s.setKnowledgeMap)
  const setQuests = useStore((s) => s.setQuests)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [selectedQuest, setSelectedQuest] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)

  const recommendations = (knowledgeMap?.recommended_quests || []) as Array<RecommendedQuest | null>
  const pageSize = 6
  const totalPages = Math.max(1, Math.ceil(recommendations.length / pageSize))
  const displayed = recommendations.slice(page * pageSize, (page + 1) * pageSize)

  // Clamp page when recommendations change
  useEffect(() => {
    setPage(p => Math.min(p, Math.max(0, totalPages - 1)))
  }, [recommendations.length])

  const selectedQuestData = selectedQuest ? recommendations.find(q => q?.id === selectedQuest) : null

  const [refreshMsg, setRefreshMsg] = useState<string | null>(null)

  async function refreshMap() {
    setRefreshing(true)
    setRefreshMsg(null)
    try {
      const d = await fetchMap(true)
      setKnowledgeMap(d)
    } catch (e: any) {
      console.error(e)
      const msg = e?.message || 'Refresh failed'
      if (msg.includes('Map fetch failed')) {
        setRefreshMsg(msg)
        setTimeout(() => setRefreshMsg(null), 3000)
      } else {
        setRefreshError(true)
        setTimeout(() => setRefreshError(false), 3000)
      }
    }
    setRefreshing(false)
  }

  async function handleAccept(questId: string) {
    setAccepting(questId)
    try {
      await acceptQuest(questId)
      // Replace accepted quest with null placeholder (preserve slot positions)
      if (knowledgeMap) {
        const updated = { ...knowledgeMap, recommended_quests: (knowledgeMap.recommended_quests || []).map(q => q?.id === questId ? null : q) }
        setKnowledgeMap(updated)
      }
      setSelectedQuest(null)
      // Then refresh from server
      const d = await fetchActiveQuests()
      setQuests(d.quests || [])
    } catch (e) {
      console.error(e)
      setAcceptError('The guild clerk fumbles the paperwork...')
      setTimeout(() => setAcceptError(null), 3000)
    }
    setAccepting(null)
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      position: 'relative', overflow: 'hidden',
    }}>
      <AnimatedBg prefix="guild" fallback="/bg/bulletin-bg.png" style={{ position: 'absolute', inset: 0 }} />
      {displayed.map((quest, i) => {
        const slot = PARCHMENT_SLOTS[i]
        if (!slot) return null
        if (!quest) return null  // Accepted quest — empty slot
        return (
          <QuestSlot
            key={quest.id}
            quest={quest} slot={slot}
            onAccept={handleAccept}
            accepting={accepting === quest.id}
            onSelect={setSelectedQuest}
            selected={selectedQuest === quest.id}
          />
        )
      })}

      {/* Quest detail overlay */}
      {selectedQuestData && (
        <QuestDetailOverlay
          quest={selectedQuestData}
          onClose={() => setSelectedQuest(null)}
          onAccept={handleAccept}
          accepting={accepting === selectedQuestData.id}
          acceptError={acceptError}
        />
      )}

      {displayed.filter(Boolean).length === 0 && (
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

      {/* Refresh button */}
      <button
        onClick={refreshMap}
        disabled={refreshing}
        style={{
          position: 'absolute', top: '3%', right: '3%', zIndex: 10,
          fontFamily: 'var(--font-pixel)',
          fontSize: 'clamp(5px, 0.5vw, 6px)',
          padding: '3px 8px',
          cursor: refreshing ? 'wait' : 'pointer',
          background: 'linear-gradient(180deg, #6a4428 0%, #4a2a14 50%, #3a2210 100%)',
          border: '2px solid #6b4c2a',
          color: '#f0e68c',
          boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {refreshing ? '...' : refreshError ? 'FAILED' : `REFRESH (-50G)`}
      </button>
      {refreshMsg && (
        <div style={{
          position: 'absolute', top: '10%', right: '3%', zIndex: 10,
          fontFamily: 'var(--font-pixel)', fontSize: 'clamp(5px, 0.5vw, 6px)',
          color: '#ff6b6b', textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          background: 'rgba(10,8,4,0.9)', padding: '3px 6px',
          border: '1px solid rgba(255,107,107,0.3)', borderRadius: '2px',
        }}>
          {refreshMsg}
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
              background: 'rgba(40,25,10,0.85)', border: '1px solid #6b4c2a',
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
              background: 'rgba(40,25,10,0.85)', border: '1px solid #6b4c2a',
              color: page >= totalPages - 1 ? '#5a4a3a' : '#f0e68c',
              cursor: 'pointer', padding: '2px 6px',
            }}
          >▶</button>
        </div>
      )}
    </div>
  )
}
