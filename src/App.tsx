import { useWebSocket } from './websocket'
import TopBar from './panels/TopBar'
import CharacterPanel from './panels/CharacterPanel'
import AdventureLog from './panels/AdventureLog'
import CenterTabs from './panels/CenterTabs'
import SkillPanel from './panels/SkillPanel'
import BagPanel from './panels/BagPanel'

export default function App() {
  useWebSocket()

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
      height: '100vh',
      gap: '2px',
      padding: '2px',
    }}>
      <TopBar />
      <div style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr 280px',
        gap: '2px',
        minHeight: 0,
      }}>
        {/* Left: Character (60%) + Chronicle (40%) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
          <div style={{ flex: 6, minHeight: 0, overflow: 'auto' }}>
            <CharacterPanel />
          </div>
          <div style={{ flex: 4, minHeight: 0, overflow: 'hidden' }}>
            <AdventureLog />
          </div>
        </div>

        {/* Center */}
        <CenterTabs />

        {/* Right: Skills + Inventory (equal height) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
          <SkillPanel />
          <div className="pixel-panel" style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div className="pixel-panel-title" style={{ textAlign: 'center' }}>INVENTORY</div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <BagPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
