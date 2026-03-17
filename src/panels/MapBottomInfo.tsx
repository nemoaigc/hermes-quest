import { useEffect, useMemo, useRef, useState } from 'react'
import { startCycle as apiStartCycle, fetchFeedbackDigest } from '../api'
import RpgButton from '../components/RpgButton'
import { useStore } from '../store'
import type { GameEvent } from '../store'
import type { CyclePhase, Workflow } from '../types'

const PHASE_ORDER: CyclePhase[] = ['reflect', 'plan', 'execute', 'report']
const PHASE_LABELS: Record<CyclePhase, string> = {
  reflect: 'REFLECT',
  plan: 'PLAN',
  execute: 'EXECUTE',
  report: 'REPORT',
}
const PHASE_COLORS: Record<CyclePhase, string> = {
  reflect: '#b48eff',
  plan: '#f0e68c',
  execute: '#55aaff',
  report: '#66bb6a',
}

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '')
  const normalized = cleaned.length === 3
    ? cleaned.split('').map((char) => char + char).join('')
    : cleaned
  const value = Number.parseInt(normalized, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function paintPanel(ctx: CanvasRenderingContext2D, width: number, height: number, accent: string) {
  ctx.clearRect(0, 0, width, height)

  const bg = ctx.createLinearGradient(0, 0, 0, height)
  bg.addColorStop(0, '#2a1c10')
  bg.addColorStop(0.45, '#181009')
  bg.addColorStop(1, '#120c07')
  ctx.fillStyle = bg
  drawRoundedRect(ctx, 0.5, 0.5, width - 1, height - 1, 6)
  ctx.fill()

  const glow = ctx.createRadialGradient(width * 0.2, height * 0.1, 4, width * 0.2, height * 0.1, width * 0.7)
  glow.addColorStop(0, hexToRgba(accent, 0.16))
  glow.addColorStop(1, hexToRgba(accent, 0))
  ctx.fillStyle = glow
  drawRoundedRect(ctx, 0.5, 0.5, width - 1, height - 1, 6)
  ctx.fill()

  for (let y = 7; y < height; y += 7) {
    ctx.strokeStyle = 'rgba(255,255,255,0.025)'
    ctx.beginPath()
    ctx.moveTo(6, y + 0.5)
    ctx.lineTo(width - 6, y + 0.5)
    ctx.stroke()
  }

  for (let x = 10; x < width; x += 18) {
    for (let y = 12; y < height; y += 18) {
      ctx.fillStyle = hexToRgba(accent, 0.06)
      ctx.fillRect(x, y, 1, 1)
    }
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  drawRoundedRect(ctx, 0.5, 0.5, width - 1, height - 1, 6)
  ctx.stroke()

  ctx.strokeStyle = hexToRgba(accent, 0.34)
  ctx.lineWidth = 1
  drawRoundedRect(ctx, 2, 2, width - 4, height - 4, 5)
  ctx.stroke()

  ctx.fillStyle = hexToRgba(accent, 0.3)
  ctx.fillRect(8, 8, width - 16, 1)

  const corners: Array<[number, number, number, number]> = [
    [7, 7, 10, 1],
    [7, 7, 1, 10],
    [width - 17, 7, 10, 1],
    [width - 8, 7, 1, 10],
    [7, height - 8, 10, 1],
    [7, height - 17, 1, 10],
    [width - 17, height - 8, 10, 1],
    [width - 8, height - 17, 1, 10],
  ]
  corners.forEach(([x, y, w, h]) => {
    ctx.fillStyle = hexToRgba(accent, 0.55)
    ctx.fillRect(x, y, w, h)
  })
}

function getPhaseDetail(event: GameEvent): string {
  const phase = event.data.phase
  if (phase === 'reflect') return typeof event.data.summary === 'string' ? event.data.summary : ''
  if (phase === 'plan') {
    if (typeof event.data.reason === 'string') return event.data.reason
    if (typeof event.data.target_quest === 'string') return event.data.target_quest
    if (typeof event.data.target_workflow === 'string') return `Target ${event.data.target_workflow}`
  }
  if (phase === 'execute') {
    if (typeof event.data.detail === 'string') return event.data.detail
    if (typeof event.data.summary === 'string') return event.data.summary
  }
  if (phase === 'report') {
    if (Array.isArray(event.data.outcomes)) {
      return event.data.outcomes.filter((item): item is string => typeof item === 'string').join(' | ')
    }
    if (typeof event.data.quest_completed === 'string') return `Completed ${event.data.quest_completed}`
  }
  return ''
}

function CanvasPanel({
  title,
  accent,
  status,
  statusColor,
  children,
  style,
}: {
  title: string
  accent: string
  status?: string
  statusColor?: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    function render() {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const width = container.clientWidth
      const height = container.clientHeight
      if (width < 10 || height < 10) return

      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      paintPanel(ctx, width, height, accent)
    }

    render()
    const ro = new ResizeObserver(render)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [accent])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        minHeight: '82px',
        overflow: 'hidden',
        borderRadius: '6px',
        ...style,
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          padding: '8px 9px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ fontSize: '6px', color: '#d0b080', letterSpacing: '0.8px' }}>{title}</div>
          {status ? (
            <div style={{ fontSize: '6px', color: statusColor || accent, letterSpacing: '0.5px' }}>{status}</div>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  )
}

export default function MapBottomInfo() {
  const state = useStore((store) => store.state)
  const km = useStore((store) => store.knowledgeMap)
  const sites = useStore((store) => store.sites)
  const classifying = useStore((store) => store.classifying)
  const events = useStore((store) => store.events)
  const cycleProgress = useStore((store) => store.cycleProgress)
  const setFeedbackDigest = useStore((store) => store.setFeedbackDigest)

  const [classifyStatus, setClassifyStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [cycleLoading, setCycleLoading] = useState(false)
  const [cycleStatus, setCycleStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle')
  const [feedbackCount, setFeedbackCount] = useState(0)

  const prevClassifyingRef = useRef(false)
  const cycleTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const workflows: Workflow[] = km?.workflows || km?.continents || []

  useEffect(() => {
    return () => {
      cycleTimersRef.current.forEach(clearTimeout)
    }
  }, [])

  useEffect(() => {
    let doneTimer: ReturnType<typeof setTimeout> | undefined
    if (classifying) {
      setClassifyStatus('running')
    } else if (prevClassifyingRef.current) {
      setClassifyStatus('done')
      doneTimer = setTimeout(() => setClassifyStatus('idle'), 3000)
    }
    prevClassifyingRef.current = classifying
    return () => {
      if (doneTimer) clearTimeout(doneTimer)
    }
  }, [classifying])

  useEffect(() => {
    if (!cycleProgress) return
    setCycleLoading(true)
    setCycleStatus('loading')
    if (cycleProgress.phase === 'report') {
      const doneTimer = setTimeout(() => {
        setCycleStatus('success')
        setCycleLoading(false)
      }, 1800)
      cycleTimersRef.current.push(doneTimer)
    }
  }, [cycleProgress])

  useEffect(() => {
    fetchFeedbackDigest()
      .then((digest) => {
        setFeedbackDigest(digest)
        setFeedbackCount((digest.summary?.total_positive || 0) + (digest.summary?.total_negative || 0))
      })
      .catch(() => {})
  }, [setFeedbackDigest])

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

  async function handleStartCycle() {
    cycleTimersRef.current.forEach(clearTimeout)
    cycleTimersRef.current = []
    setCycleLoading(true)
    setCycleStatus('loading')
    try {
      await apiStartCycle()
    } catch {
      setCycleStatus('failed')
      const failTimer = setTimeout(() => {
        setCycleLoading(false)
        setCycleStatus('idle')
      }, 3000)
      cycleTimersRef.current.push(failTimer)
    }
  }

  const definedSites = sites.filter((site) => site.defined)
  const undefinedCount = sites.length - definedSites.length
  const avgMastery = workflows.length > 0
    ? Math.round((workflows.reduce((sum, workflow) => sum + (workflow.mastery || 0), 0) / workflows.length) * 100)
    : 0
  const hasCycleTrace = latestCycleTrace.some((item) => item.hasEvent)
  const completedCycle = cycleStatus === 'success'
  const activePhase = completedCycle ? null : cycleProgress?.phase || (cycleLoading ? 'reflect' : null)
  const activePhaseIndex = activePhase ? PHASE_ORDER.indexOf(activePhase) : -1

  const classifyLabel = classifyStatus === 'running' ? 'SORTING' : classifyStatus === 'done' ? 'DONE' : 'READY'
  const classifyColor = classifyStatus === 'running' ? '#f0e68c' : classifyStatus === 'done' ? '#66bb6a' : '#8b7355'
  const cycleLabel = cycleStatus === 'failed'
    ? 'FAILED'
    : completedCycle
      ? 'COMPLETE'
      : cycleLoading
        ? 'RUNNING'
        : hasCycleTrace
          ? 'LAST RUN'
          : 'READY'
  const cycleColor = cycleStatus === 'failed' ? '#ff6b6b' : completedCycle ? '#66bb6a' : cycleLoading ? '#f0e68c' : '#8b7355'

  const stats = [
    { label: 'LV', value: state?.level ?? 0, color: '#f0e68c' },
    { label: 'SKILLS', value: state?.skills_count ?? 0, color: '#55aaff' },
    { label: 'SITES', value: definedSites.length, color: '#66bb6a' },
    { label: 'UNSEEN', value: undefinedCount, color: '#ff9944' },
    { label: 'MAP', value: state?.workflows_discovered ?? workflows.length, color: '#b48eff' },
    { label: 'MASTERY', value: `${avgMastery}%`, color: '#d0b080' },
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 0.92fr 1.48fr 0.82fr',
        gap: '8px',
        width: '100%',
        minWidth: 0,
        fontFamily: 'var(--font-pixel)',
      }}
    >
      <CanvasPanel title="CURRENT STATS" accent="#d0b080" status={`LV ${state?.level ?? 0}`} statusColor="#f0e68c">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 8px', flex: 1 }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '5px', color: '#7d674d' }}>{stat.label}</div>
              <div style={{ fontSize: '8px', color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </CanvasPanel>

      <CanvasPanel title="CLASSIFY" accent="#f0e68c" status={classifyLabel} statusColor={classifyColor}>
        <div
          style={{
            height: '9px',
            background: 'rgba(0,0,0,0.26)',
            border: '1px solid rgba(107, 76, 42, 0.45)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: classifyStatus === 'running' ? '78%' : classifyStatus === 'done' ? '100%' : '0%',
              height: '100%',
              background: classifyStatus === 'running'
                ? 'linear-gradient(90deg, #785b22 0%, #f0e68c 100%)'
                : classifyStatus === 'done'
                  ? 'linear-gradient(90deg, #2f5c34 0%, #66bb6a 100%)'
                  : 'transparent',
              transition: 'width 0.35s ease',
            }}
          />
        </div>
        <div style={{ fontSize: '6px', color: '#9a7f5f', lineHeight: '1.35' }}>
          {classifyStatus === 'running'
            ? 'LLM is rebuilding map categories after your latest site edits.'
            : classifyStatus === 'done'
              ? 'Latest site changes have been reclassified into the world map.'
              : 'Deleting or editing a site will trigger a fresh classification pass.'}
        </div>
      </CanvasPanel>

      <CanvasPanel title="CYCLE FLOW" accent="#55aaff" status={cycleLabel} statusColor={cycleColor}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {PHASE_ORDER.map((phase, index) => {
            const isDone = completedCycle ? latestCycleTrace[index]?.hasEvent : index < activePhaseIndex
            const isCurrent = !completedCycle && index === activePhaseIndex
            return (
              <div
                key={phase}
                style={{
                  flex: 1,
                  height: '8px',
                  borderRadius: '999px',
                  background: isDone ? '#66bb6a' : isCurrent ? PHASE_COLORS[phase] : 'rgba(0,0,0,0.22)',
                  border: `1px solid ${isDone ? '#4a9a4a' : isCurrent ? hexToRgba(PHASE_COLORS[phase], 0.8) : 'rgba(107, 76, 42, 0.35)'}`,
                  boxShadow: isCurrent ? `0 0 8px ${hexToRgba(PHASE_COLORS[phase], 0.22)}` : 'none',
                }}
              />
            )
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {latestCycleTrace.map(({ phase, detail, hasEvent }, index) => {
            const isDone = completedCycle ? hasEvent : index < activePhaseIndex
            const isCurrent = !completedCycle && index === activePhaseIndex
            const text = detail || (isCurrent ? 'Waiting for step output...' : hasEvent ? 'Recorded.' : 'Pending...')
            return (
              <div
                key={phase}
                style={{
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'flex-start',
                  padding: '4px 5px',
                  borderRadius: '4px',
                  background: isCurrent
                    ? hexToRgba(PHASE_COLORS[phase], 0.12)
                    : isDone
                      ? 'rgba(102, 187, 106, 0.08)'
                      : 'rgba(0,0,0,0.16)',
                  border: `1px solid ${isCurrent
                    ? hexToRgba(PHASE_COLORS[phase], 0.26)
                    : isDone
                      ? 'rgba(102, 187, 106, 0.2)'
                      : 'rgba(107, 76, 42, 0.2)'}`,
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '3px',
                    flexShrink: 0,
                    background: isDone ? '#66bb6a' : isCurrent ? PHASE_COLORS[phase] : 'rgba(42, 28, 15, 0.95)',
                    border: `1px solid ${isDone ? '#4a9a4a' : isCurrent ? hexToRgba(PHASE_COLORS[phase], 0.85) : 'rgba(107, 76, 42, 0.35)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '6px',
                    color: isDone || isCurrent ? '#101010' : '#876e52',
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '5px', color: PHASE_COLORS[phase], letterSpacing: '0.5px', marginBottom: '2px' }}>
                    {PHASE_LABELS[phase]}
                  </div>
                  <div
                    style={{
                      fontSize: '6px',
                      color: isCurrent ? '#e2c89d' : isDone ? '#e8d5b0' : '#8c7457',
                      lineHeight: '1.28',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {text}
                  </div>
                </div>
              </div>
            )
          })}
          {!hasCycleTrace && !cycleLoading ? (
            <div style={{ fontSize: '6px', color: '#7c6548', lineHeight: '1.3' }}>
              Start a cycle and this panel will capture each step live.
            </div>
          ) : null}
        </div>
      </CanvasPanel>

      <CanvasPanel
        title="ACTION"
        accent="#66bb6a"
        status={feedbackCount > 0 ? `${feedbackCount} FB` : 'READY'}
        statusColor={feedbackCount > 0 ? '#f0e68c' : '#8b7355'}
      >
        <div style={{ fontSize: '6px', color: '#9a7f5f', lineHeight: '1.35', flex: 1 }}>
          Launch a quest cycle using the current map state and recorded feedback.
        </div>
        <RpgButton onClick={handleStartCycle} disabled={cycleLoading || classifying}>
          {cycleStatus === 'loading' ? '...' : cycleStatus === 'success' ? 'DONE' : cycleStatus === 'failed' ? 'FAILED' : '\u25B6 CYCLE'}
        </RpgButton>
      </CanvasPanel>
    </div>
  )
}
