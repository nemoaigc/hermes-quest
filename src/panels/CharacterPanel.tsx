import { useStore } from '../store'
import { ClassIcon } from '../utils/icons'

const CLASS_DISPLAY: Record<string, string> = {
  warrior: 'Artificer', artificer: 'Artificer',
  mage: 'Scholar', scholar: 'Scholar',
  ranger: 'Automancer', automancer: 'Automancer',
  paladin: 'Polymath', polymath: 'Polymath',
  necromancer: 'Hivemind', hivemind: 'Hivemind',
}

function Bar({ label, current, max, color }: { label: string; current: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0
  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: '#c8a87a' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color }}>{current}/{max}</span>
      </div>
      <div style={{
        height: '8px', background: 'rgba(10,8,4,0.6)',
        border: '1px solid rgba(107,76,42,0.4)', borderRadius: '1px',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: '1px',
          background: `linear-gradient(180deg, ${color} 0%, ${color}99 100%)`,
          boxShadow: `0 0 4px ${color}40`,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}

export default function CharacterPanel() {
  const state = useStore((s) => s.state)

  if (!state) return (
    <div className="pixel-panel" style={{ flexShrink: 0 }}>
      <div className="pixel-panel-title" style={{ textAlign: 'center' }}>CHARACTER</div>
      <div style={{ color: 'var(--text-dim)', fontSize: '10px', textAlign: 'center', padding: '8px' }}>Loading...</div>
    </div>
  )

  return (
    <div className="pixel-panel" style={{ flexShrink: 0 }}>
      <div className="pixel-panel-title" style={{ textAlign: 'center' }}>CHARACTER</div>

      {/* Portrait + Identity — horizontal layout */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
        {/* Avatar — same size as NPC portraits */}
        <img src="/avatar.png" alt="Hermes" style={{
          width: '80px', height: '80px', flexShrink: 0,
          imageRendering: 'pixelated',
          border: '1px solid rgba(107,76,42,0.4)',
          borderRadius: '3px',
        }} />

        {/* Name + Class + Title */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--gold)', letterSpacing: '1px' }}>
            {state.name}
          </div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: 'var(--cyan)', marginTop: '2px' }}>
            Lv.{state.level} {CLASS_DISPLAY[state.class] || state.class}
          </div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: '#8b7355', marginTop: '1px' }}>
            {state.title}
          </div>
        </div>
      </div>

      {/* Stat Bars */}
      <Bar label="HP" current={state.hp} max={state.hp_max} color="#ff6b6b" />
      <Bar label="MP" current={state.mp} max={state.mp_max} color="#4ecdc4" />
      <Bar label="XP" current={state.xp} max={state.xp_to_next} color="#00ff88" />

      {/* Understanding */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: '6px', padding: '4px 0',
        borderTop: '1px solid rgba(107,76,42,0.3)',
      }}>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: '#c8a87a' }}>UNDERSTANDING</span>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--cyan)' }}>
          {state.understanding < 0 ? '...' : `${Math.round(state.understanding)}%`}
        </span>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '2px 8px', marginTop: '4px',
        fontSize: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#8b7355' }}>Cycles</span>
          <span style={{ color: '#e8d5b0' }}>{state.total_cycles}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#8b7355' }}>Skills</span>
          <span style={{ color: '#e8d5b0' }}>{state.skills_count}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#8b7355' }}>Gold</span>
          <span style={{ color: '#f0e68c' }}>{state.gold ?? 0}G</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#8b7355' }}>Workflows</span>
          <span style={{ color: '#e8d5b0' }}>{state.workflows_discovered ?? 0}</span>
        </div>
      </div>
    </div>
  )
}
