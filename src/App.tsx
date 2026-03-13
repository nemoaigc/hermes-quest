import { useWebSocket } from './websocket'
import TopBar from './panels/TopBar'
import CharacterPanel from './panels/CharacterPanel'
import SkillPanel from './panels/SkillPanel'
import CenterTabs from './panels/CenterTabs'
import AdventureLog from './panels/AdventureLog'

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
          <CharacterPanel />
          <SkillPanel />
        </div>
        <CenterTabs />
        <AdventureLog />
      </div>
    </div>
  )
}
