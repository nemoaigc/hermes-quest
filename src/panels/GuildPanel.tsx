import BulletinBoard from './BulletinBoard'

export default function GuildPanel() {
  return (
    <div style={{
      width: '100%', height: '100%',
      position: 'relative', overflow: 'hidden',
    }}>
      <BulletinBoard />
    </div>
  )
}
