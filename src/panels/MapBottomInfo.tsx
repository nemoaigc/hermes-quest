import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { startCycle as apiStartCycle } from '../api'
import PanelCard from '../components/PanelCard'
import RpgButton from '../components/RpgButton'
import type { Workflow } from '../types'

const SITE_COLORS = ['#ff5555', '#ff9944', '#f0e68c', '#66bb6a', '#55aaff', '#b48eff']

/** MAP bottom — site list + stats & cycle action */
export default function MapBottomInfo() {
  const km = useStore((s) => s.knowledgeMap)
  const sites = useStore((s) => s.sites)
  const classifying = useStore((s) => s.classifying)
  const [classifyDone, setClassifyDone] = useState(false)
  const [cycleLoading, setCycleLoading] = useState(false)
  const prevClassifyingRef = useRef(false)

  // Track classify done state
  useEffect(() => {
    if (classifying) { setClassifyDone(false) }
  }, [classifying])
  // When classifying stops, briefly show DONE
  useEffect(() => {
    if (prevClassifyingRef.current && !classifying) {
      setClassifyDone(true)
      setTimeout(() => setClassifyDone(false), 3000)
    }
    prevClassifyingRef.current = classifying
  }, [classifying])
  const workflows: Workflow[] = km?.workflows || km?.continents || []

  const [cycleStatus, setCycleStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle')

  async function handleStartCycle() {
    setCycleLoading(true)
    setCycleStatus('loading')
    try {
      await apiStartCycle()
      // Show loading for 5s so progress bar fills visually, then DONE for 3s
      setTimeout(() => {
        setCycleStatus('success')
        setTimeout(() => { setCycleLoading(false); setCycleStatus('idle') }, 3000)
      }, 5000)
    } catch {
      setCycleStatus('failed')
      setTimeout(() => { setCycleLoading(false); setCycleStatus('idle') }, 3000)
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

      {/* Right: status + cycle button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '90px', flexShrink: 0, justifyContent: 'center' }}>
        {/* Status progress bar — fills 0→100% */}
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
        <RpgButton onClick={handleStartCycle} disabled={cycleLoading || classifying}>
          {cycleStatus === 'loading' ? '...' : cycleStatus === 'success' ? 'DONE' : cycleStatus === 'failed' ? 'FAILED' : '\u25B6 CYCLE'}
        </RpgButton>
      </div>
    </div>
  )
}
