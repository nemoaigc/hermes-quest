import { useState } from 'react'
import { useStore } from '../store'
import { startCycle as apiStartCycle } from '../api'
import PanelCard from '../components/PanelCard'
import RpgButton from '../components/RpgButton'

const CAT_COLOR: Record<string, string> = {
  coding: 'var(--cyan)', research: 'var(--purple)', automation: 'var(--gold)',
  creative: '#ff9944', general: '#8b7355', ml: '#42a5f5',
}

/** MAP bottom — site list + stats & cycle action */
export default function MapBottomInfo() {
  const km = useStore((s) => s.knowledgeMap)
  const sites = useStore((s) => s.sites)
  const [cycleLoading, setCycleLoading] = useState(false)
  const workflows = km?.workflows || km?.continents || []
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

  const definedSites = sites.filter(s => s.defined)
  const undefinedCount = sites.filter(s => !s.defined).length

  return (
    <div style={{ display: 'flex', gap: '10px', width: '100%', fontFamily: 'var(--font-pixel)' }}>
      {/* Left: site list */}
      <PanelCard style={{ flex: 1, overflow: 'auto', minHeight: '60px' }}>
        {definedSites.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '8px', color: '#6a5a3a', fontStyle: 'italic' }}>
            Start a cycle to explore...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {definedSites.map(site => {
              const wf = site.workflow_id ? workflows.find((w: any) => w.id === site.workflow_id) : null
              const skillCount = wf ? ((wf as any).skills_involved?.length ?? 0) : 0
              const mastery = wf ? Math.round(((wf as any).mastery || 0) * 100) : 0
              const color = CAT_COLOR[site.domain || 'general'] || '#8b7355'
              return (
                <div key={site.id} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '2px 4px',
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
              <div style={{ fontSize: '6px', color: '#5a4a3a', padding: '2px 4px', fontStyle: 'italic' }}>
                +{undefinedCount} unexplored
              </div>
            )}
          </div>
        )}
      </PanelCard>

      {/* Right: compact stats + action */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '100px', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: '#8b7355', textAlign: 'center' }}>
          <span style={{ color: '#f0e68c' }}>{definedSites.length}</span> active regions
        </div>
        <RpgButton onClick={handleStartCycle} disabled={cycleLoading}>
          {cycleStatus === 'loading' ? 'EXPLORING...' : cycleStatus === 'success' ? 'CYCLE STARTED' : cycleStatus === 'failed' ? 'FAILED' : '\u25B6 START CYCLE'}
        </RpgButton>
      </div>
    </div>
  )
}
