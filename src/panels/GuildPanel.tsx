import BulletinBoard from './BulletinBoard'
import QuestTracker from './QuestTracker'

export default function GuildPanel() {
  return (
    <div style={{
      background: 'linear-gradient(180deg, #0d0a08 0%, #1a120a 30%, #0d0a08 100%)',
      border: '1px solid #3a2a1a',
      padding: '6px',
      minHeight: '100%',
    }}>
      <BulletinBoard />
      <div style={{
        height: '3px', margin: '10px 0',
        background: 'linear-gradient(180deg, #5c3a1e 0%, #8b5e3c 40%, #5c3a1e 100%)',
        borderTop: '1px solid #a0764a',
        borderBottom: '1px solid #3a2210',
      }} />
      <QuestTracker />
    </div>
  )
}
