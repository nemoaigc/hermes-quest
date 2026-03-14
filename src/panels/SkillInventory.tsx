import { useState } from 'react'
import { useStore } from '../store'
import { SkillIcon } from '../utils/icons'
import { API_URL } from '../api'

const CAT_COLOR: Record<string, string> = {
  coding: 'var(--cyan)', research: 'var(--purple)',
  automation: 'var(--gold)', creative: '#ff9944',
}

export default function SkillInventory() {
  const skills = useStore((s) => s.skills)
  const setSkills = useStore((s) => s.setSkills)
  const [selected, setSelected] = useState<string | null>(null)
  const [forgetting, setForgetting] = useState(false)

  const selectedSkill = skills.find((s) => s.name === selected)

  async function forgetSkill(name: string) {
    setForgetting(true)
    try {
      await fetch(`${API_URL}/api/skills/${encodeURIComponent(name)}`, { method: 'DELETE' })
      const res = await fetch(`${API_URL}/api/skills`)
      setSkills(await res.json())
      setSelected(null)
    } catch (e) {
      console.error('Failed to forget skill', e)
    }
    setForgetting(false)
  }

  if (selectedSkill) {
    return (
      <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SkillIcon name={selectedSkill.name} category={selectedSkill.category || ''} size={28} />
          <div>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--gold)' }}>
              {selectedSkill.name}
            </div>
            <div style={{ fontSize: '7px', color: CAT_COLOR[selectedSkill.category || ''] || 'var(--text-dim)' }}>
              {selectedSkill.category} · v{selectedSkill.version} · {selectedSkill.rarity}
            </div>
          </div>
        </div>
        <div style={{ fontSize: '9px', color: 'var(--text)', lineHeight: '1.5', maxHeight: '80px', overflow: 'auto' }}>
          {selectedSkill.description || 'No description.'}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="pixel-btn" onClick={() => setSelected(null)} style={{ fontSize: '6px', padding: '3px 8px' }}>◀ BACK</button>
          <button
            className="pixel-btn"
            onClick={() => forgetSkill(selectedSkill.name)}
            disabled={forgetting}
            style={{ fontSize: '6px', padding: '3px 8px', color: 'var(--red)', borderColor: 'var(--red)' }}
          >{forgetting ? '...' : 'FORGET'}</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {skills.map((skill) => (
        <div
          key={skill.name}
          onClick={() => setSelected(skill.name)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 6px', cursor: 'pointer',
            borderLeft: `2px solid ${CAT_COLOR[skill.category || ''] || 'var(--border)'}`,
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,94,60,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <SkillIcon name={skill.name} category={skill.category || ''} size={16} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '9px', color: 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {skill.name}
            </div>
          </div>
          <span style={{
            fontFamily: 'var(--font-pixel)', fontSize: '4px',
            color: CAT_COLOR[skill.category || ''] || 'var(--text-dim)',
          }}>
            {skill.category}
          </span>
        </div>
      ))}
    </div>
  )
}
