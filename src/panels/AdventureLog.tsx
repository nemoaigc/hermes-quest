import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useStore } from '../store'
import { formatEvent, formatTime } from '../utils/formatters'
import { EventIcon } from '../utils/icons'
import { API_URL, failQuest, fetchActiveQuests } from '../api'
import { LS_KEYS } from '../constants/storage'
import type { GameEvent } from '../store'

// Only events where the AGENT made a decision that maps to a skill/workflow
// Cycle cards have their own feedback buttons (in CyclePhaseGroup)
const FEEDBACKABLE_TYPES = new Set([
  'skill_drop',      // agent learned a skill — user says good/bad skill
  'quest_complete',   // agent finished a quest — user judges the outcome
  'train_start',      // agent chose to train X — user steers direction
  'hub_acquire',      // agent installed a skill — user approves/rejects
])

const PHASE_ORDER = ['reflect', 'plan', 'execute', 'report'] as const
const PHASE_META: Record<string, { color: string; label: string }> = {
  reflect: { color: '#b48eff', label: 'REFLECT' },
  plan: { color: '#f0e68c', label: 'PLAN' },
  execute: { color: '#55aaff', label: 'EXECUTE' },
  report: { color: '#66bb6a', label: 'REPORT' },
}

// --- Display item types ---
type DisplayItem =
  | { kind: 'event'; event: GameEvent; originalIndex: number }
  | { kind: 'cycle_group'; phases: GameEvent[]; id: string }

// --- Cycle Phase Group (collapsed by default) ---
function CyclePhaseGroup({ phases, onFeedback, sentFeedback }: {
  phases: GameEvent[]
  onFeedback: (key: string, type: 'positive' | 'negative', event_type: string, detail: string, eventData?: Record<string, unknown>) => void
  sentFeedback: Record<string, 'positive' | 'negative'>
}) {
  const [expanded, setExpanded] = useState(false)

  // Extract key info from phases
  const reflectPhase = phases.find(p => (p.data as Record<string, unknown>)?.phase === 'reflect')
  const planPhase = phases.find(p => (p.data as Record<string, unknown>)?.phase === 'plan')
  const reportPhase = phases.find(p => (p.data as Record<string, unknown>)?.phase === 'report')

  const reflectData = reflectPhase?.data as Record<string, unknown> | undefined
  const planData = planPhase?.data as Record<string, unknown> | undefined
  const reportData = reportPhase?.data as Record<string, unknown> | undefined

  // Build collapsed summary: what changed + why
  const target = (planData?.target_workflow as string) || ''
  const reflectSummary = (reflectData?.summary as string) || ''
  const reportOutcomes = (reportData?.outcomes as string[]) || []

  // Detect if feedback influenced this cycle
  const feedbackInfluenced = reflectSummary.toLowerCase().includes('feedback') ||
    reflectSummary.toLowerCase().includes('avoid') ||
    reflectSummary.toLowerCase().includes('pivot') ||
    reflectSummary.toLowerCase().includes('rejection') ||
    reflectSummary.toLowerCase().includes('approval')

  // Build one-line summary — prioritize REFLECT when feedback-influenced
  let summary = ''
  if (feedbackInfluenced && reflectSummary) {
    // Extract the most relevant sentence from REFLECT
    const sentences = reflectSummary.split(/[.!]\s+/)
    const feedbackSentence = sentences.find(s =>
      /feedback|avoid|pivot|reject|approv/i.test(s)
    )
    summary = (feedbackSentence || sentences[0] || '').slice(0, 100)
  } else if (reportOutcomes.length > 0) {
    summary = reportOutcomes[0]
  } else if (planData?.reason) {
    summary = (planData.reason as string).slice(0, 80)
  } else if (target) {
    summary = `Training in ${target}`
  } else {
    summary = 'Evolution cycle completed'
  }

  // Timestamp from the latest phase
  const latestTs = phases[phases.length - 1]?.ts || phases[0]?.ts

  return (
    <div style={{
      background: 'rgba(20, 16, 10, 0.7)',
      border: '1px solid rgba(107, 76, 42, 0.4)',
      borderRadius: '3px',
      marginBottom: '4px',
      marginLeft: '-2px',
      overflow: 'hidden',
    }}>
      {/* Collapsed header — always visible */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 6px',
          cursor: 'pointer',
          borderLeft: feedbackInfluenced ? '3px solid #b48eff' : '3px solid #8b7355',
        }}
      >
        {/* Phase dots */}
        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
          {PHASE_ORDER.map(phase => {
            const exists = phases.some(p => (p.data as Record<string, unknown>)?.phase === phase)
            return (
              <div key={phase} style={{
                width: '6px', height: '6px', borderRadius: '1px',
                background: exists ? PHASE_META[phase].color : '#2a1c0e',
                border: `1px solid ${exists ? PHASE_META[phase].color : '#3a2210'}`,
                opacity: exists ? 1 : 0.3,
              }} />
            )
          })}
        </div>

        {/* Summary text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '8px', color: feedbackInfluenced ? '#c8a87a' : '#8b7355',
            lineHeight: '1.3',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: feedbackInfluenced ? 'Georgia, serif' : 'var(--font-pixel)',
            fontStyle: feedbackInfluenced ? 'italic' : 'normal',
          }}>
            {feedbackInfluenced && <span style={{ color: '#b48eff' }}>You shaped this: </span>}
            {summary}
          </div>
        </div>

        {/* Feedback buttons for the cycle */}
        {(() => {
          const cycleKey = `cycle-${latestTs}`
          const alreadySent = sentFeedback[cycleKey]
          return (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                display: 'flex', gap: '2px', alignItems: 'center',
                opacity: alreadySent ? 0.6 : 0.4,
                transition: 'opacity 0.15s',
                pointerEvents: alreadySent ? 'none' : 'auto',
                flexShrink: 0,
              }}
              onMouseEnter={e => { if (!alreadySent) (e.currentTarget as HTMLElement).style.opacity = '1' }}
              onMouseLeave={e => { if (!alreadySent) (e.currentTarget as HTMLElement).style.opacity = '0.4' }}
            >
              <button
                onClick={() => onFeedback(cycleKey, 'positive', 'cycle_phase', summary, reflectPhase?.data)}
                style={{
                  background: alreadySent === 'positive' ? 'rgba(0,180,0,0.2)' : 'none',
                  border: 'none', cursor: 'pointer', padding: '1px 2px',
                  fontSize: '8px', lineHeight: 1,
                  filter: alreadySent === 'negative' ? 'grayscale(1)' : 'none',
                }}
                title="Good cycle"
              >👍</button>
              <button
                onClick={() => onFeedback(cycleKey, 'negative', 'cycle_phase', summary, reflectPhase?.data)}
                style={{
                  background: alreadySent === 'negative' ? 'rgba(180,0,0,0.2)' : 'none',
                  border: 'none', cursor: 'pointer', padding: '1px 2px',
                  fontSize: '8px', lineHeight: 1,
                  filter: alreadySent === 'positive' ? 'grayscale(1)' : 'none',
                }}
                title="Bad cycle"
              >👎</button>
            </div>
          )
        })()}

        {/* Time + chevron */}
        <div style={{
          fontFamily: 'var(--font-pixel)', fontSize: 'clamp(5px, 0.6vw, 6px)',
          color: 'var(--text-dim)', flexShrink: 0,
        }}>
          {formatTime(latestTs)}
        </div>
        <span style={{ fontSize: '9px', color: '#a08060', flexShrink: 0 }}>
          {expanded ? '▾' : '▸'}
        </span>
      </div>

      {/* Expanded: show all phases in narrative order */}
      {expanded && (
        <div style={{
          borderTop: '1px solid rgba(107, 76, 42, 0.2)',
          padding: '2px 0',
        }}>
          {phases.map((phase, idx) => {
            const data = phase.data as Record<string, unknown>
            const phaseName = (data?.phase as string) || ''
            const meta = PHASE_META[phaseName]
            const isReflect = phaseName === 'reflect'
            const targetWorkflow = typeof data?.target_workflow === 'string' ? data.target_workflow : ''
            const content: string = String(
              (data?.summary as string) ||
              (data?.detail as string) ||
              (data?.reason as string) ||
              (Array.isArray(data?.outcomes) ? data.outcomes.join(', ') : '') ||
              ''
            )

            return (
              <div key={idx} style={{
                padding: isReflect ? '5px 8px' : '3px 8px',
                borderLeft: `${isReflect ? 4 : 2}px solid ${meta?.color || '#8b7355'}`,
                marginLeft: '8px',
                ...(isReflect ? {
                  background: 'rgba(180, 142, 255, 0.06)',
                } : {}),
              }}>
                {/* Phase label */}
                <div style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: isReflect ? '8px' : '7px',
                  color: meta?.color || '#8b7355',
                  letterSpacing: '0.5px',
                  marginBottom: '1px',
                }}>
                  {meta?.label || phaseName.toUpperCase()}
                </div>
                {/* Content */}
                {content !== '' ? (
                  <div style={{
                    fontSize: isReflect ? '9px' : '8px',
                    color: isReflect ? '#c8a87a' : '#8b7355',
                    lineHeight: '1.35',
                    fontFamily: isReflect ? 'Georgia, serif' : 'inherit',
                    fontStyle: isReflect ? 'italic' : 'normal',
                  }}>
                    {content}
                  </div>
                ) : null}
                {/* Target workflow for PLAN */}
                {phaseName === 'plan' && targetWorkflow !== '' ? (
                  <div style={{ fontSize: '7px', color: '#5a4a3a', marginTop: '1px' }}>
                    Target: {targetWorkflow}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// --- Helper functions ---
function loadFeedback(): Record<string, 'positive' | 'negative'> {
  try {
    const raw = localStorage.getItem(LS_KEYS.feedback)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveFeedback(state: Record<string, 'positive' | 'negative'>) {
  try {
    localStorage.setItem(LS_KEYS.feedback, JSON.stringify(state))
  } catch { /* ignore */ }
}

function loadClearedAt(): number {
  try {
    const v = localStorage.getItem(LS_KEYS.logCleared)
    return v ? Number(v) : 0
  } catch { return 0 }
}

async function sendFeedback(type: 'positive' | 'negative', event_type: string, detail: string, eventId?: string) {
  try {
    const res = await fetch(`${API_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, event_type, detail, event_id: eventId || '' }),
    })
    if (!res.ok) throw new Error(`Feedback failed: ${res.status}`)
    return await res.json()
  } catch (e) {
    console.error('Feedback error:', e)
  }
}

// --- Main component ---
export default function AdventureLog() {
  const events = useStore((s) => s.events)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [sentFeedback, setSentFeedback] = useState<Record<string, 'positive' | 'negative'>>(loadFeedback)
  const [clearedAt, setClearedAt] = useState(loadClearedAt)
  const [showConfirm, setShowConfirm] = useState(false)
  const [failPrompt, setFailPrompt] = useState<string | null>(null)
  const [failingQuest, setFailingQuest] = useState(false)
  const [digestToast, setDigestToast] = useState<string | null>(null)
  const digestToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (digestToastTimerRef.current) clearTimeout(digestToastTimerRef.current) }
  }, [])

  const handleFeedback = useCallback((key: string, type: 'positive' | 'negative', event_type: string, detail: string, eventData?: Record<string, unknown>) => {
    setSentFeedback((prev) => {
      const next = { ...prev, [key]: type }
      saveFeedback(next)
      return next
    })
    sendFeedback(type, event_type, detail, key)
    if (digestToastTimerRef.current) clearTimeout(digestToastTimerRef.current)
    if (type === 'negative') {
      setDigestToast('Recorded. Next cycle will avoid this direction.')
    } else {
      setDigestToast('Recorded. Next cycle will prioritize this direction.')
    }
    digestToastTimerRef.current = setTimeout(() => setDigestToast(null), 3000)
    if (type === 'negative' && (event_type === 'quest_complete' || event_type === 'train_start') && eventData) {
      const questId = (eventData.quest_id as string) || (eventData.id as string)
      if (questId) setFailPrompt(key)
    }
  }, [])

  const handleFailFromChronicle = useCallback(async (questId: string) => {
    setFailingQuest(true)
    try {
      await failQuest(questId)
      const questData = await fetchActiveQuests()
      useStore.getState().setQuests(questData.quests || [])
    } catch (e) {
      console.error('failQuest from chronicle failed', e)
    }
    setFailingQuest(false)
    setFailPrompt(null)
  }, [])

  const visibleEvents = useMemo(() =>
    clearedAt
      ? events.filter((e) => { const t = new Date(e.ts).getTime(); return !isNaN(t) && t > clearedAt })
      : events,
    [events, clearedAt]
  )

  // Group consecutive cycle_phase events into cycle groups
  const displayItems = useMemo<DisplayItem[]>(() => {
    const items: DisplayItem[] = []
    let i = 0

    while (i < visibleEvents.length) {
      const ev = visibleEvents[i]

      if (ev.type === 'cycle_phase') {
        const group: GameEvent[] = []
        let hasReflect = false
        while (i < visibleEvents.length && visibleEvents[i].type === 'cycle_phase') {
          const phase = (visibleEvents[i].data as Record<string, unknown>)?.phase as string || ''
          // Only REFLECT signals a new cycle boundary — EXECUTE can repeat (progress updates)
          if (phase === 'reflect' && hasReflect) break
          if (phase === 'reflect') hasReflect = true
          group.push(visibleEvents[i])
          i++
        }
        // Reverse to chronological (newest-first list → oldest-first within group)
        group.reverse()
        // Sort by phase order for consistent narrative
        group.sort((a, b) => {
          const ap = (a.data as Record<string, unknown>)?.phase as string || ''
          const bp = (b.data as Record<string, unknown>)?.phase as string || ''
          return PHASE_ORDER.indexOf(ap as typeof PHASE_ORDER[number]) - PHASE_ORDER.indexOf(bp as typeof PHASE_ORDER[number])
        })
        items.push({ kind: 'cycle_group', phases: group, id: `cycle-${group[0].ts}` })
      } else {
        items.push({ kind: 'event', event: ev, originalIndex: i })
        i++
      }
    }

    return items
  }, [visibleEvents])

  const handleClear = useCallback(() => {
    const now = Date.now()
    localStorage.setItem(LS_KEYS.logCleared, String(now))
    setClearedAt(now)
    useStore.getState().setEvents([])
    setShowConfirm(false)
  }, [])

  return (
    <div className="pixel-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="pixel-panel-title" style={{ textAlign: 'center' }}>CHRONICLE</div>
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
      {displayItems.length === 0 ? (
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

          {displayItems.map((item, displayIdx) => {
            if (item.kind === 'cycle_group') {
              return <CyclePhaseGroup key={item.id} phases={item.phases} onFeedback={handleFeedback} sentFeedback={sentFeedback} />
            }

            // Regular event rendering
            const event = item.event
            const { type, color, text } = formatEvent(event)
            const eventKey = `${event.ts}-${event.type}-${item.originalIndex}`
            const canFeedback = FEEDBACKABLE_TYPES.has(type)
            const alreadySent = sentFeedback[eventKey]

            return (
              <div
                key={eventKey}
                onMouseEnter={() => setHoveredIdx(displayIdx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
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

                {/* Event row */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                  <span style={{ width: 14, height: 14, display: 'inline-flex', flexShrink: 0, marginTop: '1px' }}>
                    <EventIcon type={type} />
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '9px', color, lineHeight: '1.3' }}>{text}</div>
                    <div style={{
                      fontFamily: 'var(--font-pixel)', fontSize: 'clamp(5px, 0.6vw, 7px)',
                      color: 'var(--text-dim)', marginTop: '1px',
                    }}>
                      {formatTime(event.ts)}
                    </div>
                  </div>

                  {/* Feedback buttons */}
                  {canFeedback && (
                    <div style={{
                      display: 'flex', gap: '2px', alignItems: 'center',
                      opacity: alreadySent ? 0.6 : (hoveredIdx === displayIdx ? 1 : 0.25),
                      transition: 'opacity 0.15s',
                      pointerEvents: alreadySent ? 'none' : 'auto',
                      flexShrink: 0,
                    }}>
                      <button
                        onClick={() => handleFeedback(eventKey, 'positive', type, text, event.data)}
                        style={{
                          background: alreadySent === 'positive' ? 'rgba(0,180,0,0.2)' : 'none',
                          border: 'none', cursor: 'pointer', padding: '1px 2px',
                          fontSize: '8px', lineHeight: 1,
                          filter: alreadySent === 'negative' ? 'grayscale(1)' : 'none',
                        }}
                        title="Good outcome"
                      >👍</button>
                      <button
                        onClick={() => handleFeedback(eventKey, 'negative', type, text, event.data)}
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

                {/* Fail quest prompt */}
                {failPrompt === eventKey && (
                  <div style={{
                    display: 'flex', gap: '4px', alignItems: 'center',
                    background: 'rgba(180,40,40,0.15)',
                    border: '1px solid rgba(255,107,107,0.4)',
                    borderRadius: '3px',
                    padding: '2px 6px', marginTop: '3px', marginLeft: '20px',
                  }}>
                    <span style={{
                      fontFamily: 'Georgia, serif', fontStyle: 'italic',
                      fontSize: '8px', color: '#ff6b6b',
                    }}>Mark quest as failed?</span>
                    <button
                      disabled={failingQuest}
                      onClick={() => {
                        const qid = (event.data?.quest_id as string) || (event.data?.id as string)
                        if (qid) handleFailFromChronicle(qid)
                      }}
                      style={{
                        fontFamily: 'var(--font-pixel)', fontSize: '5px',
                        padding: '1px 6px', cursor: failingQuest ? 'wait' : 'pointer',
                        background: 'rgba(180,40,40,0.3)', border: '1px solid #ff6b6b',
                        color: '#ff6b6b',
                      }}
                    >{failingQuest ? '...' : 'AYE'}</button>
                    <button
                      onClick={() => setFailPrompt(null)}
                      style={{
                        fontFamily: 'var(--font-pixel)', fontSize: '5px',
                        padding: '1px 6px', cursor: 'pointer',
                        background: 'transparent', border: '1px solid rgba(139,94,60,0.5)',
                        color: '#8b7355',
                      }}
                    >NAY</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      </div>
      {/* Feedback digest toast */}
      {digestToast && (
        <div style={{
          flexShrink: 0, padding: '4px 8px',
          background: 'rgba(102, 187, 106, 0.15)',
          borderTop: '1px solid rgba(102, 187, 106, 0.3)',
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: '8px', color: '#66bb6a', textAlign: 'center',
        }}>
          {digestToast}
        </div>
      )}
      {visibleEvents.length > 0 && (
        <div style={{
          flexShrink: 0, padding: '4px 8px',
          borderTop: '1px solid rgba(107,76,42,0.3)',
          display: 'flex', justifyContent: 'center',
          position: 'relative',
        }}>
          <button onClick={() => setShowConfirm(true)} style={{
            fontFamily: 'var(--font-pixel)', fontSize: '5px', padding: '3px 12px',
            background: 'rgba(90,60,20,0.3)', border: '1px solid rgba(139,94,60,0.4)',
            color: '#8b7355', cursor: 'pointer', letterSpacing: '1px', width: '100%',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff6b6b'; e.currentTarget.style.color = '#ff6b6b' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,94,60,0.4)'; e.currentTarget.style.color = '#8b7355' }}
          >CLEAR LOG</button>

          {showConfirm && (
            <div style={{
              position: 'absolute', bottom: '100%', left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(180deg, #3a2a18 0%, #2a1c0e 100%)',
              border: '2px solid #8b6a3c',
              borderRadius: '4px',
              padding: '10px 14px',
              zIndex: 50,
              boxShadow: '0 4px 16px rgba(0,0,0,0.7)',
              whiteSpace: 'nowrap',
              marginBottom: '4px',
            }}>
              <div style={{
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                fontSize: '9px', color: '#c8a87a',
                marginBottom: '8px', textAlign: 'center',
              }}>
                Erase all chronicle entries?
              </div>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                <button
                  onClick={() => setShowConfirm(false)}
                  style={{
                    fontFamily: 'var(--font-pixel)', fontSize: '5px',
                    padding: '3px 10px', cursor: 'pointer',
                    background: 'transparent', border: '1px solid rgba(139,94,60,0.5)',
                    color: '#8b7355',
                  }}
                >NAY</button>
                <button
                  onClick={handleClear}
                  style={{
                    fontFamily: 'var(--font-pixel)', fontSize: '5px',
                    padding: '3px 10px', cursor: 'pointer',
                    background: 'rgba(180,40,40,0.3)', border: '1px solid #ff6b6b',
                    color: '#ff6b6b',
                  }}
                >AYE</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
