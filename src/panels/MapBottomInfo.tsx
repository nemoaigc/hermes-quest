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
  const [classifyDone, setClassifyDone] = useState(false)
  const [cycleLoading, setCycleLoading] = useState(false)
  const [feedbackCount, setFeedbackCount] = useState(0)
  const prevClassifyingRef = useRef(false)
  const classifyTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Track classify done state
  useEffect(() => {
    classifyTimersRef.current.forEach(clearTimeout)
    classifyTimersRef.current = []
    if (classifying) {
      const resetTimer = setTimeout(() => setClassifyDone(false), 0)
      classifyTimersRef.current.push(resetTimer)
    } else if (prevClassifyingRef.current) {
      const showTimer = setTimeout(() => setClassifyDone(true), 0)
      const hideTimer = setTimeout(() => setClassifyDone(false), 3000)
      classifyTimersRef.current.push(showTimer, hideTimer)
    }
    prevClassifyingRef.current = classifying
    return () => {
      classifyTimersRef.current.forEach(clearTimeout)
      classifyTimersRef.current = []
    }
  }, [classifying])
  const workflows: Workflow[] = km?.workflows || km?.continents || []

  const [cycleStatus, setCycleStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle')

  const cycleTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  // Cleanup cycle timers on unmount
  useEffect(() => {
    return () => {
      classifyTimersRef.current.forEach(clearTimeout)
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
    return PHASE_ORDER
      .map((phase) => {
        const event = latest.get(phase)
        if (!event) return null
        const detail = getPhaseDetail(event).trim()
        return { phase, detail }
      })
      .filter((item): item is { phase: CyclePhase; detail: string } => item !== null)
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

  // Track whether real cycle_progress events have arrived (avoids stale closure)
  const gotCycleProgressRef = useRef(false)

  useEffect(() => {
    if (cycleProgress) gotCycleProgressRef.current = true
  }, [cycleProgress])

  async function handleStartCycle() {
    // Clear any pending timers from previous cycle
    cycleTimersRef.current.forEach(clearTimeout)
    cycleTimersRef.current = []
    gotCycleProgressRef.current = false
    setCycleLoading(true)
    setCycleStatus('loading')
    try {
      await apiStartCycle()
      // If no cycle_progress events come within 15s, fall back to old behavior
      const fallback = setTimeout(() => {
        if (!gotCycleProgressRef.current) {
          setCycleStatus('success')
          const t2 = setTimeout(() => { setCycleLoading(false); setCycleStatus('idle') }, 3000)
          cycleTimersRef.current.push(t2)
        }
      }, 15000)
      cycleTimersRef.current.push(fallback)
    } catch {
      setCycleStatus('failed')
      const t = setTimeout(() => { setCycleLoading(false); setCycleStatus('idle') }, 3000)
      cycleTimersRef.current.push(t)
    }
  }

  const definedSites = sites.filter(s => s.defined)
  const undefinedCount = sites.filter(s => !s.defined).length
  const showCyclePhases = !!cycleProgress && (cycleLoading || cycleStatus === 'success')
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '156px', flexShrink: 0, justifyContent: 'center' }}>
        {/* Phase progress indicator — shows when cycle is running with real phases */}
        {showCyclePhases ? (
          <div style={{
            flex: 1, width: '100%',
            background: 'linear-gradient(180deg, rgba(45, 31, 18, 0.98), rgba(20, 14, 9, 0.98)), repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 7px)',
            border: '2px solid #5a3d20',
            borderRadius: '3px', padding: '4px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px',
            boxShadow: 'inset 0 0 0 1px rgba(240,230,140,0.08), 0 1px 4px rgba(0,0,0,0.35)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid rgba(240, 230, 140, 0.12)',
              paddingBottom: '3px',
            }}>
              <div style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: '6px',
                color: '#c8a87a',
                letterSpacing: '0.8px',
              }}>
                CYCLE CANVAS
              </div>
              <div style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: '6px',
                color: completedCycle ? '#66bb6a' : '#f0e68c',
                letterSpacing: '0.5px',
              }}>
                {completedCycle ? 'COMPLETE' : (cycleProgress ? PHASE_LABELS[cycleProgress.phase].label : 'ACTIVE')}
              </div>
            </div>
            {/* Phase steps */}
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center', justifyContent: 'center' }}>
              {PHASE_ORDER.map((phase) => {
                const phaseIdx = PHASE_ORDER.indexOf(phase)
                const currentIdx = cycleProgress ? PHASE_ORDER.indexOf(cycleProgress.phase) : -1
                const isDone = completedCycle || phaseIdx < currentIdx
                const isCurrent = !completedCycle && phaseIdx === currentIdx
                return (
                  <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                    <div style={{
                      width: '15px', height: '15px',
                      borderRadius: '2px',
                      background: isDone ? '#66bb6a' : isCurrent ? '#f0e68c' : '#24170c',
                      border: `1px solid ${isDone ? '#4a9a4a' : isCurrent ? '#c8a040' : '#4a321b'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '7px',
                      transition: 'all 0.3s',
                      boxShadow: isCurrent ? '0 0 6px rgba(240,230,140,0.25)' : 'none',
                    }}>
                      {isDone ? '\u2713' : PHASE_LABELS[phase].icon}
                    </div>
                    {phaseIdx < PHASE_ORDER.length - 1 && (
                      <div style={{
                        width: '4px', height: '1px',
                        background: isDone ? '#66bb6a' : '#3a2210',
                      }} />
                    )}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {latestCycleTrace.map(({ phase, detail }) => (
                <div key={phase} style={{
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'flex-start',
                  padding: '3px 4px',
                  borderRadius: '2px',
                  background: completedCycle && phase === 'report'
                    ? 'rgba(102, 187, 106, 0.12)'
                    : cycleProgress?.phase === phase
                      ? 'rgba(240, 230, 140, 0.1)'
                      : 'rgba(0, 0, 0, 0.16)',
                  border: `1px solid ${completedCycle && phase === 'report'
                    ? 'rgba(102, 187, 106, 0.28)'
                    : cycleProgress?.phase === phase
                      ? 'rgba(240, 230, 140, 0.24)'
                      : 'rgba(107, 76, 42, 0.24)'}`,
                }}>
                  <div style={{
                    minWidth: '42px',
                    fontSize: '5px',
                    color: PHASE_COLORS[phase],
                    fontFamily: 'var(--font-pixel)',
                    letterSpacing: '0.4px',
                  }}>
                    {PHASE_LABELS[phase].label}
                  </div>
                  <div style={{
                    flex: 1,
                    fontSize: '6px',
                    color: completedCycle && phase === 'report' ? '#f2e4bb' : '#b89b73',
                    lineHeight: '1.25',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    fontFamily: 'Georgia, serif',
                  }}>
                    {detail || '...'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Fallback: original progress bar when no phase data */
          <div style={{
            flex: 1, width: '100%',
            background: '#1a140c', border: '2px solid #3a2210',
            position: 'relative', overflow: 'hidden', borderRadius: '2px',
            display: 'flex', flexDirection: 'column-reverse',
          }}>
            <div style={{
              width: '100%',
              height: classifying ? '95%' : classifyDone ? '100%' : cycleStatus === 'success' ? '100%' : cycleLoading ? '95%' : '0%',
              background: classifying
                ? 'linear-gradient(0deg, #3a2210, #f0e68c)'
                : classifyDone || cycleStatus === 'success'
                  ? '#66bb6a'
                  : cycleLoading
                    ? 'linear-gradient(0deg, #1a3a1a, #66bb6a)'
                    : 'transparent',
              transition: classifying ? 'height 8s linear' : (classifyDone || cycleStatus === 'success') ? 'height 0.3s' : cycleLoading ? 'height 5s linear' : 'height 0.5s',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-pixel)', fontSize: '6px',
              color: classifying ? '#f0e68c' : classifyDone ? '#fff' : cycleStatus === 'success' ? '#fff' : cycleLoading ? '#66bb6a' : '#3a2a1a',
              textShadow: (classifying || cycleLoading || classifyDone) ? '0 1px 3px rgba(0,0,0,0.8)' : 'none',
              letterSpacing: '1px',
            }}>
              {classifying ? 'SORTING' : classifyDone ? 'DONE' : cycleStatus === 'success' ? 'DONE' : cycleLoading ? 'CYCLING' : 'IDLE'}
            </div>
          </div>
        )}
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
