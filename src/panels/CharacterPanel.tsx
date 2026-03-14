import { useStore } from '../store'
import { ClassIcon, ItemIcon } from '../utils/icons'

// Map legacy class names to AI-meaningful display names
const CLASS_DISPLAY: Record<string, string> = {
  warrior: 'Artificer', artificer: 'Artificer',
  mage: 'Scholar', scholar: 'Scholar',
  ranger: 'Automancer', automancer: 'Automancer',
  paladin: 'Polymath', polymath: 'Polymath',
  necromancer: 'Hivemind', hivemind: 'Hivemind',
}

const CLASS_DESC: Record<string, string> = {
  warrior: 'Code-focused', artificer: 'Code-focused',
  mage: 'Research-focused', scholar: 'Research-focused',
  ranger: 'Automation-focused', automancer: 'Automation-focused',
  paladin: 'Multi-domain', polymath: 'Multi-domain',
  necromancer: 'Delegation-focused', hivemind: 'Delegation-focused',
}

function StatBar({ label, current, max, type }: { label: string; current: number; max: number; type: string }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', fontFamily: 'var(--font-pixel)', marginBottom: '2px' }}>
        <span>{label}</span>
        <span>{current}/{max}</span>
      </div>
      <div className="stat-bar">
        <div className={`stat-bar-fill ${type}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function CharacterPanel() {
  const state = useStore((s) => s.state)

  if (!state) return (
    <div className="pixel-panel" style={{ height: '100%', overflow: 'auto' }}>
      <div className="pixel-panel-title" style={{ textAlign: 'center' }}>CHARACTER</div>
      <div style={{ color: 'var(--text-dim)', fontSize: '10px' }}>Loading...</div>
    </div>
  )

  return (
    <div className="pixel-panel" style={{ height: '100%', overflow: 'auto' }}>
      <div className="pixel-panel-title" style={{ textAlign: 'center' }}>CHARACTER</div>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <ClassIcon cls={state.class} size={32} />
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--gold)', marginTop: '4px' }}>
          {state.name}
        </div>
        <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>
          Lv.{state.level} {CLASS_DISPLAY[state.class] || state.class}
        </div>
        <div style={{ fontSize: '8px', color: 'var(--purple)' }}>
          {state.title} — {CLASS_DESC[state.class] || ''}
        </div>
      </div>

      <StatBar label="HP" current={state.hp} max={state.hp_max} type="stability" />
      <StatBar label="MP" current={state.mp} max={state.mp_max} type="energy" />
      <StatBar label="XP" current={state.xp} max={state.xp_to_next} type="xp" />

      {/* Understanding */}
      <div style={{ marginTop: '6px', fontSize: '8px', fontFamily: 'var(--font-pixel)', display: 'flex', justifyContent: 'space-between' }}>
        <span>UNDERSTANDING</span>
        <span style={{ color: 'var(--cyan)' }}>
          {state.understanding < 0 ? 'Calibrating...' : `${Math.round(state.understanding * 100)}%`}
        </span>
      </div>

      <div style={{ marginTop: '8px', fontSize: '9px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        <div><span style={{ color: 'var(--text-dim)' }}>Cycles: </span><span>{state.total_cycles}</span></div>
        <div><span style={{ color: 'var(--text-dim)' }}>Skills: </span><span>{state.skills_count}</span></div>
        <div><span style={{ color: 'var(--text-dim)' }}>Workflows: </span><span>{state.workflows_discovered ?? 0}</span></div>
        <div><span style={{ color: 'var(--text-dim)' }}>Corrections: </span><span>{state.total_corrections ?? 0}</span></div>
      </div>

      {state.inventory && state.inventory.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '8px', color: 'var(--text-dim)', marginBottom: '4px' }}>INVENTORY ({state.inventory.length})</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
            {state.inventory.slice(0, 8).map((item: any, i: number) => (
              <div key={item.id || i} title={item.name || item.type || ''} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <ItemIcon item={item.type || 'scroll'} size={16} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
