import { useState, useEffect, useRef, useMemo } from 'react'
import { useStore } from '../store'
import { startCycle as apiStartCycle, fetchFeedbackDigest } from '../api'
import PanelCard from '../components/PanelCard'
import RpgButton from '../components/RpgButton'
import type { Workflow, CyclePhase } from '../types'
import type { GameEvent } from '../store'

const SITE_COLORS = ['#ff5555', '#ff9944', '#f0e68c', '#66bb6a', '#55aaff', '#b48eff']

const PHASE_ORDER: CyclePhase[] = ['reflect', 'plan', 'execute', 'report']
const PHASE_LABELS: Record<CyclePhase, { icon: string; label: string }> = {
  reflect: { icon: '\uD83D\uDD2E', label: 'REFLECT' },
  plan: { icon: '\uD83D\uDCDC', label: 'PLAN' },
  execute: { icon: '\u2694\uFE0F', label: 'EXECUTE' },
  report: { icon: '\uD83D\uDCCA', label: 'REPORT' },
}
const PHASE_COLORS: Record<CyclePhase, string> = {
  reflect: '#b48eff',
  plan: '#f0e68c',
  execute: '#55aaff',
  report: '#66bb6a',
}

function getPhaseDetail(event: GameEvent): string {
  const phase = event.data.phase
  if (phase === 'reflect') {
    return typeof event.data.summary === 'string' ? event.data.summary : ''
  }
  if (phase === 'plan') {
    if (typeof event.data.reason === 'string') return event.data.reason
    if (typeof event.data.target_quest === 'string') return event.data.target_quest
    if (typeof event.data.target_workflow === 'string') return `Target ${event.data.target_workflow}`
    return ''
  }
  if (phase === 'execute') {
    if (typeof event.data.detail === 'string') return event.data.detail
    if (typeof event.data.summary === 'string') return event.data.summary
    return ''
  }
  if (phase === 'report') {
    if (Array.isArray(event.data.outcomes)) {
      return event.data.outcomes.filter((item): item is string => typeof item === 'string').join(' | ')
    }
    if (typeof event.data.quest_completed === 'string') return `Completed ${event.data.quest_completed}`
    return ''
  }
  return ''
}

/** MAP bottom — site list + stats & cycle action */
export default function MapBottomInfo() {
  const km = useStore((s) => s.knowledgeMap)
  const sites = useStore((s) => s.sites)
  const classifying = useStore((s) => s.classifying)
  const events = useStore((s) => s.events)
  const cycleProgress = useStore((s) => s.cycleProgress)
  const setFeedbackDigest = useStore((s) => s.setFeedbackDigest)
  const [cycleLoading, setCycleLoading] = useState(false)
  const [feedbackCount, setFeedbackCount] = useState(0)
  const workflows: Workflow[] = km?.workflows || km?.continents || []

  const [cycleStatus, setCycleStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle')

  const cycleTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  // Cleanup cycle timers on unmount
  useEffect(() => {
    return () => {
      cycleTimersRef.current.forEach(clearTimeout)
    }
  }, [])

  // When cycle progress comes in, switch to real tracking
  useEffect(() => {
    if (cycleProgress) {
      setCycleLoading(true)
      setCycleStatus('loading')
      if (cycleProgress.phase === 'report') {
        const t = setTimeout(() => {
          setCycleStatus('success')
          setCycleLoading(false)
        }, 2000)
        cycleTimersRef.current.push(t)
      }
    }
  }, [cycleProgress])

  const latestCycleTrace = useMemo(() => {
    const latest = new Map<CyclePhase, GameEvent>()
    for (const event of events) {
      if (event.type !== 'cycle_phase') continue
      const phase = event.data.phase
      if (phase !== 'reflect' && phase !== 'plan' && phase !== 'execute' && phase !== 'report') continue
      if (!latest.has(phase)) latest.set(phase, event)
      if (phase === 'reflect') break
    }
    return PHASE_ORDER.map((phase) => {
      const event = latest.get(phase)
      return {
        phase,
        detail: event ? getPhaseDetail(event).trim() : '',
        hasEvent: !!event,
      }
    })
  }, [events])

  // Fetch feedback digest count on mount
  useEffect(() => {
    fetchFeedbackDigest()
      .then(d => {
        setFeedbackDigest(d)
        setFeedbackCount((d.summary?.total_positive || 0) + (d.summary?.total_negative || 0))
      })
      .catch(() => {})
  }, [setFeedbackDigest])

  async function handleStartCycle() {
    // Clear any pending timers from previous cycle
    cycleTimersRef.current.forEach(clearTimeout)
    cycleTimersRef.current = []
    setCycleLoading(true)
    setCycleStatus('loading')
    try {
      await apiStartCycle()
    } catch {
      setCycleStatus('failed')
      const t = setTimeout(() => { setCycleLoading(false); setCycleStatus('idle') }, 3000)
      cycleTimersRef.current.push(t)
    }
  }

  const definedSites = sites.filter(s => s.defined)
  const undefinedCount = sites.filter(s => !s.defined).length
  const hasCycleTrace = latestCycleTrace.some((item) => item.hasEvent)
  const activePhase = cycleStatus === 'success'
    ? null
    : cycleProgress?.phase || (cycleLoading ? 'reflect' : null)
  const activePhaseIndex = activePhase ? PHASE_ORDER.indexOf(activePhase) : -1
  const statusLabel = classifying
    ? 'SORTING'
    : cycleStatus === 'failed'
      ? 'FAILED'
      : cycleStatus === 'success'
        ? 'COMPLETE'
        : cycleLoading
          ? 'RUNNING'
          : hasCycleTrace
            ? 'LAST RUN'
            : 'READY'
  const completedCycle = cycleStatus === 'success'

  return (
    <div style={{ display: 'flex', gap: '10px', width: '100%', fontFamily: 'var(--font-pixel)' }}>
      {/* Left: site list */}
      <PanelCard style={{ flex: 1, overflow: 'auto', minHeight: '60px' }}>
        {definedSites.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '8px', color: '#6a5a3a', fontStyle: 'italic' }}>
            Start a cycle to explore...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {definedSites.map((site, idx) => {
              const wf = site.workflow_id ? workflows.find((w) => w.id === site.workflow_id) : null
              const skillCount = wf ? (wf.skills_involved?.length ?? 0) : 0
              const mastery = wf ? Math.round((wf.mastery || 0) * 100) : 0
              const color = SITE_COLORS[idx % SITE_COLORS.length]
              return (
                <div key={site.id} style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '0 4px',
                  borderLeft: `2px solid ${color}`,
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '7px', color: '#e8d5b0', flex: 1 }}>
                    {site.name}
                  </span>
                  <span style={{ fontSize: '6px', color: '#8b7355' }}>
                    {skillCount}sk
                  </span>
                  <span style={{ fontSize: '6px', color }}>
                    {mastery}%
                  </span>
                </div>
              )
            })}
            {undefinedCount > 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', fontSize: '6px', color: '#5a4a3a', padding: '0 4px', fontStyle: 'italic' }}>
                +{undefinedCount} unexplored
              </div>
            )}
          </div>
        )}
      </PanelCard>

      {/* Right: cycle phases + button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '170px', flexShrink: 0, justifyContent: 'center' }}>
        <div style={{
          flex: 1,
          width: '100%',
          background: 'linear-gradient(180deg, #24160c 0%, #171009 100%)',
          border: '2px solid #4a321b',
          borderRadius: '3px',
          padding: '5px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          boxShadow: 'inset 0 0 0 1px rgba(240,230,140,0.06)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(107, 76, 42, 0.35)',
            paddingBottom: '3px',
          }}>
            <div style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '6px',
              color: '#c8a87a',
              letterSpacing: '0.8px',
            }}>
              CYCLE FLOW
            </div>
            <div style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '6px',
              color: cycleStatus === 'failed' ? '#ff6b6b' : completedCycle ? '#66bb6a' : cycleLoading ? '#f0e68c' : '#8b7355',
              letterSpacing: '0.5px',
            }}>
              {statusLabel}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {latestCycleTrace.map(({ phase, detail, hasEvent }) => {
              const phaseIdx = PHASE_ORDER.indexOf(phase)
              const isDone = completedCycle ? hasEvent : phaseIdx < activePhaseIndex
              const isCurrent = !completedCycle && phaseIdx === activePhaseIndex
              const text = detail || (isCurrent ? 'Waiting for step output...' : hasEvent ? 'Recorded.' : 'Pending...')
              return (
                <div key={phase} style={{
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'flex-start',
                  padding: '4px',
                  borderRadius: '2px',
                  background: isCurrent
                    ? 'rgba(240, 230, 140, 0.08)'
                    : isDone
                      ? 'rgba(102, 187, 106, 0.08)'
                      : 'rgba(0, 0, 0, 0.14)',
                  border: `1px solid ${isCurrent
                    ? 'rgba(240, 230, 140, 0.24)'
                    : isDone
                      ? 'rgba(102, 187, 106, 0.2)'
                      : 'rgba(107, 76, 42, 0.22)'}`,
                }}>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    flexShrink: 0,
                    borderRadius: '2px',
                    background: isDone ? '#66bb6a' : isCurrent ? '#f0e68c' : '#2a1c0f',
                    border: `1px solid ${isDone ? '#4a9a4a' : isCurrent ? '#c8a040' : '#4a321b'}`,
                    color: isDone ? '#11210f' : isCurrent ? '#3b2c12' : '#7b674a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '6px',
                  }}>
                    {phaseIdx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-pixel)',
                      fontSize: '5px',
                      color: PHASE_COLORS[phase],
                      letterSpacing: '0.5px',
                      marginBottom: '2px',
                    }}>
                      {PHASE_LABELS[phase].label}
                    </div>
                    <div style={{
                      fontSize: '6px',
                      color: isCurrent ? '#d8bf93' : isDone ? '#e8d5b0' : '#8b7355',
                      lineHeight: '1.25',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {text}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {!hasCycleTrace && !cycleLoading && !classifying && (
            <div style={{
              fontSize: '6px',
              color: '#7b674a',
              lineHeight: '1.25',
              textAlign: 'center',
              paddingTop: '2px',
            }}>
              Launch a cycle to record its flow here.
            </div>
          )}
        </div>
        {/* Feedback digest badge + cycle button */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {feedbackCount > 0 && !cycleLoading && (
            <div style={{
              fontFamily: 'var(--font-pixel)', fontSize: '5px',
              color: '#8b7355', background: '#1a140c',
              border: '1px solid #3a2210', borderRadius: '2px',
              padding: '2px 4px', whiteSpace: 'nowrap',
            }} title="Feedback entries that will guide the next cycle">
              {feedbackCount}fb
            </div>
          )}
          <RpgButton onClick={handleStartCycle} disabled={cycleLoading || classifying} style={{ flex: 1 }}>
            {cycleStatus === 'loading' ? '...' : cycleStatus === 'success' ? 'DONE' : cycleStatus === 'failed' ? 'FAILED' : '\u25B6 CYCLE'}
          </RpgButton>
        </div>
      </div>
    </div>
  )
}
