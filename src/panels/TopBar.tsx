import { useStore } from '../store'

const CLASS_DISPLAY: Record<string, string> = {
  warrior: 'Artificer', artificer: 'Artificer',
  mage: 'Scholar', scholar: 'Scholar',
  ranger: 'Automancer', automancer: 'Automancer',
  paladin: 'Polymath', polymath: 'Polymath',
  necromancer: 'Hivemind', hivemind: 'Hivemind',
}

export default function TopBar() {
  const state = useStore((s) => s.state)
  const connected = useStore((s) => s.connected)

  if (!state) return (
    <div className="pixel-panel" style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--gold)' }}>
        HERMES QUEST
      </span>
      <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Connecting...</span>
    </div>
  )

  return (
    <div className="pixel-panel" style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--gold)' }}>
        HERMES QUEST
      </span>
      <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px' }}>
        Lv.{state.level} {CLASS_DISPLAY[state.class] || state.class} — {state.title}
      </span>
      <span style={{ fontSize: '10px' }}>
        <span style={{ color: 'var(--gold)' }}>{state.gold}G</span>
        {' | '}
        <span style={{ color: connected ? 'var(--green)' : 'var(--red)' }}>
          {connected ? 'ONLINE' : 'OFFLINE'}
        </span>
      </span>
    </div>
  )
}
