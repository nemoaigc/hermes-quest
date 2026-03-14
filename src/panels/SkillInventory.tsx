import { useState } from 'react'
import { useStore } from '../store'
import { SkillIcon } from '../utils/icons'
import { API_URL } from '../api'

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

  return (
    <div className="pixel-panel" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
      {/* Title moved to SkillPanel tab label */}

      {selectedSkill ? (
        <div style={{ padding: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <SkillIcon name={selectedSkill.name} category={selectedSkill.category || ''} size={24} />
            <div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--gold)' }}>
                {selectedSkill.name}
              </div>
              <div style={{ fontSize: '8px', color: 'var(--text-dim)' }}>
                {selectedSkill.category} v{selectedSkill.version} [{selectedSkill.rarity}]
              </div>
            </div>
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text)', lineHeight: '1.4', marginBottom: '8px', maxHeight: '60px', overflow: 'auto' }}>
            {selectedSkill.description || 'No description available.'}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="pixel-btn" onClick={() => setSelected(null)} style={{ fontSize: '7px' }}>BACK</button>
            <button
              className="pixel-btn"
              onClick={() => forgetSkill(selectedSkill.name)}
              disabled={forgetting}
              style={{ fontSize: '7px', color: 'var(--red)', borderColor: 'var(--red)' }}
            >
              {forgetting ? '...' : 'FORGET'}
            </button>
          </div>
        </div>
      ) : (
        <div className="skill-grid">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className={`skill-slot rarity-${skill.rarity}`}
              title={skill.name}
              onClick={() => setSelected(skill.name)}
              style={{ cursor: 'pointer' }}
            >
              <SkillIcon name={skill.name} category={skill.category || ''} size={18} />
            </div>
          ))}
          {Array.from({ length: Math.max(0, 12 - skills.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="skill-slot" style={{ opacity: 0.3 }} />
          ))}
        </div>
      )}
    </div>
  )
}
