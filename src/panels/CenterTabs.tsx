import { useState } from 'react'
import WorldMap from './WorldMap'
import QuestBoard from './QuestBoard'
import Shop from './Shop'

const TABS = [
  { id: 'map', label: 'MAP' },
  { id: 'quests', label: 'QUESTS' },
  { id: 'shop', label: 'SHOP' },
] as const

type TabId = typeof TABS[number]['id']

export default function CenterTabs() {
  const [tab, setTab] = useState<TabId>('map')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pixel-panel" style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'map' && <WorldMap />}
        {tab === 'quests' && <QuestBoard />}
        {tab === 'shop' && <Shop />}
      </div>
    </div>
  )
}
