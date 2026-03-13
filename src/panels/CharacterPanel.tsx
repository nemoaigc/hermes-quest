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
    <div className="pixel-panel" style={{ flex: '0 0 auto' }}>
      <div className="pixel-panel-title">CHARACTER</div>
      <div style={{ color: 'var(--text-dim)', fontSize: '10px' }}>Loading...</div>
    </div>
  )

  return (
    <div className="pixel-panel" style={{ flex: '0 0 auto' }}>
      <div className="pixel-panel-title">CHARACTER</div>
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

      <StatBar label="STABILITY" current={state.stability} max={state.stability_max} type="stability" />
      <StatBar label="ENERGY" current={state.energy} max={state.energy_max} type="energy" />
      <StatBar label="XP" current={state.xp} max={state.xp_to_next} type="xp" />

      <div style={{ marginTop: '8px', fontSize: '9px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        <div><span style={{ color: 'var(--text-dim)' }}>Cycles: </span><span>{state.total_cycles}</span></div>
        <div><span style={{ color: 'var(--text-dim)' }}>Skills: </span><span>{state.skills_count}</span></div>
        <div><span style={{ color: 'var(--text-dim)' }}>Quests: </span><span>{state.completed_quests}</span></div>
        <div><span style={{ color: 'var(--text-dim)' }}>Mastered: </span><span>{state.regions_cleared.length}</span></div>
      </div>

      {state.inventory.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '8px', color: 'var(--text-dim)', marginBottom: '4px' }}>INVENTORY</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
            {state.inventory.map((item) => (
              <div key={item.item} title={item.item} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <ItemIcon item={item.item} size={16} />
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-pixel)' }}>x{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
