import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import KnowledgeMap from './KnowledgeMap'
import SubRegionGraph from './SubRegionGraph'
import GuildPanel from './GuildPanel'
import Shop from './Shop'
import { API_URL } from '../api'
import { LS_KEYS } from '../constants/storage'
import type { TabId } from '../types'

import PanelCard from '../components/PanelCard'
import RpgButton from '../components/RpgButton'
import TavernSceneArea from './TavernSceneArea'
import TavernNpcPanel from './TavernNpcPanel'
import MapBottomInfo from './MapBottomInfo'
import GuildBottomInfo from './GuildBottomInfo'
import ShopBottomInfo from './ShopBottomInfo'

// Extend window for SHOW TO NPC bridge
declare global {
  interface Window {
    __hermesShowToNpc?: (message: string) => void
  }
}

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'map', label: 'MAP' },
  { id: 'guild', label: 'GUILD' },
  { id: 'shop', label: 'SHOP' },
  { id: 'npc', label: 'TAVERN' },
]

export default function CenterTabs() {
  const activeTab = useStore((s) => s.activeTab)
  const setActiveTab = useStore((s) => s.setActiveTab)
  const [activeNpc, setActiveNpc] = useState<string | null>(null)
  const [chatNpc, setChatNpc] = useState<string | null>(null)
  const [sceneMode, setSceneMode] = useState<'default' | 'chatter' | 'rumors'>('default')
  const [mapSelectedContinent, setMapSelectedContinent] = useState<string | null>(null)
  const knowledgeMap = useStore((s) => s.knowledgeMap)
  const [cycleLoading, setCycleLoading] = useState(false)
  const [rumors, setRumors] = useState<Array<{ id: string; text: string; author: string; handle: string; likes: number; time: string }>>([])
  const [rumorsLoading, setRumorsLoading] = useState(false)
  const [rumorsError, setRumorsError] = useState<string | null>(null)

  // Persist NPC chat history across open/close (+ localStorage)
  const chatHistoryRef = useRef<Record<string, Array<{ role: 'npc' | 'user'; text: string }>>>(
    (() => { try { const s = localStorage.getItem(LS_KEYS.npcHistory); return s ? JSON.parse(s) : {} } catch { return {} } })()
  )

  // Ref for gossip refresh callback (avoids DOM querySelector hack)
  const gossipRefreshRef = useRef<(() => void) | null>(null)

  // Prefill message for "SHOW TO NPC" bag feature
  const [npcPrefill, setNpcPrefill] = useState<string | null>(null)

  // Register global bridge for SHOW TO NPC
  useEffect(() => {
    window.__hermesShowToNpc = (message: string) => {
      setActiveTab('npc')
      setNpcPrefill(message)
      // Use currently active NPC, or default to guild_master
      setChatNpc(prev => prev || 'guild_master')
      setActiveNpc(null)
    }
    return () => { window.__hermesShowToNpc = undefined }
  }, [setActiveTab])

  // Clear prefill after chat NPC changes
  useEffect(() => {
    if (!chatNpc) setNpcPrefill(null)
  }, [chatNpc])

  async function fetchRumors() {
    setRumorsLoading(true)
    setRumorsError(null)
    try {
      const res = await fetch(`${API_URL}/api/rumors/feed?max=15`)
      if (!res.ok) throw new Error(`Rumors fetch: ${res.status}`)
      const data = await res.json()
      if (data.ok) setRumors(data.rumors)
      else throw new Error('Rumors data not ok')
    } catch (e) {
      console.error('fetchRumors failed', e)
      setRumorsError('The rumor mill has gone silent...')
      setTimeout(() => setRumorsError(null), 5000)
    }
    setRumorsLoading(false)
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', gap: '0', marginBottom: '0',
        background: 'linear-gradient(to bottom, #2a1a0e, #1a120a)',
        borderBottom: '2px solid #6b4c2a',
      }}>
        {TABS.map((t) => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.color = '#c8a87a'; e.currentTarget.style.background = 'rgba(58,42,26,0.4)' } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.color = '#6a5a3a'; e.currentTarget.style.background = 'transparent' } }}
              style={{
                flex: 1,
                fontFamily: 'var(--font-pixel)',
                fontSize: '7px',
                padding: '8px 6px',
                background: isActive
                  ? 'linear-gradient(to bottom, #3a2a1a, #2a1a0e)'
                  : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #f0e68c' : '2px solid transparent',
                color: isActive ? '#f0e68c' : '#6a5a3a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s',
                letterSpacing: '1px',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      {/* Scene — fixed ratio, pinned to top under tabs, wood frame border */}
      <div style={{
        width: '100%', aspectRatio: '1024 / 572',
        flexShrink: 0, position: 'relative', overflow: 'hidden',
        border: '2px solid #6b4c2a',
        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(160,120,60,0.15)',
        marginTop: '2px',
      }}>
        {activeTab === 'map' && <KnowledgeMap onContinentSelect={setMapSelectedContinent} />}
        {activeTab === 'guild' && <GuildPanel />}
        {activeTab === 'shop' && <Shop />}
        {activeTab === 'npc' && (
          <TavernSceneArea
            sceneMode={sceneMode}
            onSceneMode={setSceneMode}
            rumors={rumors}
            rumorsLoading={rumorsLoading}
            rumorsError={rumorsError}
            onFetchRumors={fetchRumors}
            gossipRefreshRef={gossipRefreshRef}
          />
        )}
      </div>
      {/* Bottom bar */}
      <div style={{
        flex: 1, minHeight: '80px',
        background: 'linear-gradient(180deg, #3a2515 0%, #2a1a0c 40%, #1e1208 100%)',
        border: '2px solid #6b4c2a',
        boxShadow: 'inset 0 0 0 1px rgba(160,120,60,0.15)',
        marginTop: '2px',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: '10px 14px',
        overflow: 'auto',
        position: 'relative',
      } as React.CSSProperties}>
        {/* TAVERN: NPC gallery/card/chat in bottom panel */}
        {activeTab === 'npc' && (
          <TavernNpcPanel
            activeNpc={activeNpc}
            onNpcSelect={(id) => { setActiveNpc(id); setChatNpc(null) }}
            chatNpc={chatNpc}
            onNpcChat={(id) => { setChatNpc(id); setActiveNpc(null) }}
            onCloseBio={() => setActiveNpc(null)}
            onCloseChat={() => { setChatNpc(null); setActiveNpc(null) }}
            chatHistoryRef={chatHistoryRef}
            npcPrefill={npcPrefill}
          />
        )}
        {activeTab === 'map' && (() => {
          // Handle fog region selection — show empty "unknown" state
          if (mapSelectedContinent?.startsWith('fog:')) {
            return (
              <PanelCard style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '14px', color: '#8a7a5a', marginBottom: '8px' }}>???</div>
                <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '11px', color: '#6a5a3a', textAlign: 'center', maxWidth: '250px', lineHeight: '1.6' }}>
                  This region remains shrouded in mystery. Complete quests to unveil its secrets.
                </div>
              </PanelCard>
            )
          }
          const selected = mapSelectedContinent && knowledgeMap
            ? (knowledgeMap.continents || knowledgeMap.workflows || []).find((c) => c.id === mapSelectedContinent)
            : null
          const displayWorkflow = selected
            || (knowledgeMap ? (knowledgeMap.continents || knowledgeMap.workflows || [])[0] : null)
          if (displayWorkflow && knowledgeMap) {
            return (
              <PanelCard style={{ width: '100%', height: '100%', padding: 0, overflow: 'hidden' }}>
                <SubRegionGraph
                  continent={displayWorkflow}
                  connections={knowledgeMap.connections}
                  onBack={() => setMapSelectedContinent(null)}
                  extraAction={
                    <RpgButton onClick={async () => {
                      setCycleLoading(true)
                      try {
                        const res = await fetch(`${API_URL}/api/cycle/start`, { method: 'POST' })
                        if (res.ok) {
                          setTimeout(() => setCycleLoading(false), 2000)
                        } else {
                          setTimeout(() => setCycleLoading(false), 2000)
                        }
                      } catch {
                        setTimeout(() => setCycleLoading(false), 2000)
                      }
                    }} disabled={cycleLoading} small>
                      {cycleLoading ? '...' : '\u25B6 CYCLE'}
                    </RpgButton>
                  }
                />
              </PanelCard>
            )
          }
          return <MapBottomInfo />
        })()}
        {activeTab === 'guild' && <GuildBottomInfo />}
        {activeTab === 'shop' && <ShopBottomInfo />}
      </div>
    </div>
  )
}
