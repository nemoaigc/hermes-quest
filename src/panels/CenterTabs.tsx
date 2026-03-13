import { useStore } from '../store'
import KnowledgeMap from './KnowledgeMap'
import QuestBoard from './QuestBoard'
import Shop from './Shop'
import NPCDialogBar from './NPCDialogBar'
import type { TabId } from '../types'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'map', label: 'MAP' },
  { id: 'guild', label: 'GUILD' },
  { id: 'shop', label: 'SHOP' },
]

export default function CenterTabs() {
  const activeTab = useStore((s) => s.activeTab)
  const setActiveTab = useStore((s) => s.setActiveTab)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pixel-panel" style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'map' && <KnowledgeMap />}
        {activeTab === 'guild' && <QuestBoard />}
        {activeTab === 'shop' && <Shop />}
      </div>
      <NPCDialogBar />
    </div>
  )
}
