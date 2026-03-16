import { useState } from 'react'
import { useStore } from '../store'
import { startCycle as apiStartCycle } from '../api'
import PanelCard from '../components/PanelCard'
import RpgButton from '../components/RpgButton'

/** MAP bottom — two columns: workflow list + stats & action */
export default function MapBottomInfo() {
  const km = useStore((s) => s.knowledgeMap)
  const [cycleLoading, setCycleLoading] = useState(false)
  const workflows = km?.workflows || km?.continents || []
  const fogCount = km?.fog_regions?.length || 0
  const avgMastery = workflows.length > 0
    ? workflows.reduce((a, w) => a + ((w as any).mastery || 0), 0) / workflows.length
    : 0

  const [cycleStatus, setCycleStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle')

  async function handleStartCycle() {
    setCycleLoading(true)
    setCycleStatus('loading')
    try {
      await apiStartCycle()
      setCycleStatus('success')
      setTimeout(() => { setCycleLoading(false); setCycleStatus('idle') }, 2000)
    } catch {
      setCycleStatus('failed')
      setTimeout(() => { setCycleLoading(false); setCycleStatus('idle') }, 2000)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '10px', width: '100%', fontFamily: 'var(--font-pixel)' }}>
      {/* Left: mini map preview — scattered nodes */}
      <PanelCard style={{ flex: 1, position: 'relative', minHeight: '60px', overflow: 'hidden' }}>
        {workflows.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '8px', color: '#6a5a3a', fontStyle: 'italic' }}>
            Start a cycle to explore...
          </div>
        ) : (
          <>
            {workflows.map((w: any, i: number) => {
              const angle = (i / Math.max(workflows.length, 1)) * Math.PI * 2
              const r = 30
              const cx = 50 + Math.cos(angle) * r
              const cy = 50 + Math.sin(angle) * r
              const catColor: Record<string, string> = { coding: 'var(--cyan)', research: 'var(--purple)', automation: 'var(--gold)', creative: '#ff9944' }
              return (
                <div key={w.id} title={`${w.name} \u2014 ${Math.round((w.mastery || 0) * 100)}%`} style={{
                  position: 'absolute',
                  left: `${cx}%`, top: `${cy}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${12 + (w.mastery || 0) * 16}px`,
                  height: `${12 + (w.mastery || 0) * 16}px`,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, ${catColor[w.category] || '#8b7355'}, rgba(0,0,0,0.6))`,
                  border: '1px solid rgba(200,160,100,0.3)',
                  boxShadow: `0 0 ${4 + (w.mastery || 0) * 8}px ${catColor[w.category] || '#8b7355'}40`,
                  cursor: 'pointer',
                }} />
              )
            })}
            {/* Connection lines */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              {workflows.length > 1 && workflows.slice(0, -1).map((_: any, i: number) => {
                const a1 = (i / workflows.length) * Math.PI * 2
                const a2 = ((i + 1) / workflows.length) * Math.PI * 2
                return <line key={i} x1={`${50 + Math.cos(a1) * 30}%`} y1={`${50 + Math.sin(a1) * 30}%`} x2={`${50 + Math.cos(a2) * 30}%`} y2={`${50 + Math.sin(a2) * 30}%`} stroke="rgba(139,94,60,0.3)" strokeWidth="1" strokeDasharray="3 2" />
              })}
            </svg>
            {fogCount > 0 && <div style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '5px', color: '#6a5a3a', fontFamily: 'var(--font-pixel)' }}>?x{fogCount}</div>}
          </>
        )}
      </PanelCard>

      {/* Right: stats column + action */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '120px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <PanelCard style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#f0e68c', lineHeight: 1 }}>{workflows.length}</div>
            <div style={{ fontSize: '5px', color: '#8b7355', marginTop: '2px' }}>REGIONS</div>
          </PanelCard>
          <PanelCard style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: 'var(--cyan)', lineHeight: 1 }}>{Math.round(avgMastery * 100)}%</div>
            <div style={{ fontSize: '5px', color: '#8b7355', marginTop: '2px' }}>MASTERY</div>
          </PanelCard>
        </div>
        <RpgButton onClick={handleStartCycle} disabled={cycleLoading}>
          {cycleStatus === 'loading' ? 'EXPLORING...' : cycleStatus === 'success' ? 'CYCLE STARTED' : cycleStatus === 'failed' ? 'FAILED' : '\u25B6 START CYCLE'}
        </RpgButton>
      </div>
    </div>
  )
}
