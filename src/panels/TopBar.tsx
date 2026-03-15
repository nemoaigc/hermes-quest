import { useStore } from '../store'

export default function TopBar() {
  const connected = useStore((s) => s.connected)

  return (
    <div className="pixel-panel" style={{ padding: '8px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--gold)', letterSpacing: '2px' }}>
          HERMES QUEST
        </span>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: 'var(--text-dim)', letterSpacing: '1px', marginTop: '2px' }}>
          AI Self-Evolution RPG
        </span>
      </div>
      <span style={{
        position: 'absolute', right: '16px',
        fontSize: '8px',
        color: connected ? 'var(--green)' : 'var(--red)',
        fontFamily: 'var(--font-pixel)',
      }}>
        {connected ? '●' : '○'}
      </span>
    </div>
  )
}
