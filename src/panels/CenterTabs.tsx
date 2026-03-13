import { useStore } from '../store'
import KnowledgeMap from './KnowledgeMap'
import GuildPanel from './GuildPanel'
import Shop from './Shop'
import NPCDialogBar from './NPCDialogBar'
import type { TabId } from '../types'

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'map', label: 'MAP', icon: '🗺' },
  { id: 'guild', label: 'GUILD', icon: '⚔' },
  { id: 'shop', label: 'SHOP', icon: '🏪' },
]

export default function CenterTabs() {
  const activeTab = useStore((s) => s.activeTab)
  const setActiveTab = useStore((s) => s.setActiveTab)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', gap: '0', marginBottom: '0',
        background: 'linear-gradient(to bottom, #2a2440, #1a1926)',
        borderBottom: '2px solid #3a3850',
      }}>
        {TABS.map((t) => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1,
                fontFamily: 'var(--font-pixel)',
                fontSize: '7px',
                padding: '8px 6px',
                background: isActive
                  ? 'linear-gradient(to bottom, #4a4870, #3a3660)'
                  : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #ffe66d' : '2px solid transparent',
                color: isActive ? '#ffe66d' : '#6a6880',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s',
                letterSpacing: '1px',
              }}
            >
              <span style={{ fontSize: '10px', lineHeight: 1 }}>{t.icon}</span>
              {t.label}
            </button>
          )
        })}
      </div>
      <div className="pixel-panel" style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'map' && <KnowledgeMap />}
        {activeTab === 'guild' && <GuildPanel />}
        {activeTab === 'shop' && <Shop />}
      </div>
      <NPCDialogBar />
    </div>
  )
}
