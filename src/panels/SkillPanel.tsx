import { useState } from 'react'
import SkillInventory from './SkillInventory'
import BagPanel from './BagPanel'

type SubTab = 'skills' | 'bag'

export default function SkillPanel() {
  const [tab, setTab] = useState<SubTab>('skills')

  return (
    <div className="pixel-panel" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
        <button
          className="pixel-btn"
          onClick={() => setTab('skills')}
          style={{
            fontSize: '6px', padding: '3px 8px', flex: 1,
            borderColor: tab === 'skills' ? 'var(--gold)' : 'var(--border)',
            color: tab === 'skills' ? 'var(--gold)' : 'var(--text-dim)',
            background: tab === 'skills' ? 'var(--highlight)' : undefined,
          }}
        >
          SKILLS
        </button>
        <button
          className="pixel-btn"
          onClick={() => setTab('bag')}
          style={{
            fontSize: '6px', padding: '3px 8px', flex: 1,
            borderColor: tab === 'bag' ? 'var(--gold)' : 'var(--border)',
            color: tab === 'bag' ? 'var(--gold)' : 'var(--text-dim)',
            background: tab === 'bag' ? 'var(--highlight)' : undefined,
          }}
        >
          BAG
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'skills' ? <SkillInventory /> : <BagPanel />}
      </div>
    </div>
  )
}
