import { useState } from 'react'
import { useStore } from '../store'
import { SkillIcon } from '../utils/icons'
import { API_URL } from '../api'

const CAT_COLOR: Record<string, string> = {
  coding: 'var(--cyan)', research: 'var(--purple)',
  automation: 'var(--gold)', creative: '#ff9944',
}

export default function SkillInventory() {
  const allSkills = useStore((s) => s.skills)
  const skills = allSkills.filter(s => s.name && s.name.trim())
  const setSkills = useStore((s) => s.setSkills)
  const [selected, setSelected] = useState<string | null>(null)
  const [forgetting, setForgetting] = useState(false)
  const [confirmForget, setConfirmForget] = useState(false)
  const [forgetError, setForgetError] = useState(false)

  const selectedSkill = skills.find((s) => s.name === selected)

  async function forgetSkill(name: string) {
    setForgetting(true)
    setForgetError(false)
    try {
      const del = await fetch(`${API_URL}/api/skills/${encodeURIComponent(name)}`, { method: 'DELETE' })
      if (!del.ok) throw new Error(`Delete failed: ${del.status}`)
      const res = await fetch(`${API_URL}/api/skills`)
      if (!res.ok) throw new Error(`Refresh failed: ${res.status}`)
      setSkills(await res.json())
      setSelected(null)
    } catch (e) {
      console.error('Failed to forget skill', e)
      setForgetError(true)
      setTimeout(() => setForgetError(false), 3000)
    }
    setForgetting(false)
    setConfirmForget(false)
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
        {confirmForget ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
            padding: '6px', background: 'rgba(255,107,107,0.05)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '2px',
          }}>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: '#ff6b6b', textAlign: 'center' }}>
              Forget {selectedSkill.name}?
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="pixel-btn"
                onClick={() => { setConfirmForget(false); forgetSkill(selectedSkill.name) }}
                disabled={forgetting}
                style={{ fontSize: '6px', padding: '3px 8px', color: '#ff6b6b', borderColor: '#ff6b6b', background: 'rgba(255,107,107,0.15)', cursor: forgetting ? 'wait' : 'pointer' }}
              >{forgetting ? '...' : 'YES'}</button>
              <button
                className="pixel-btn"
                onClick={() => setConfirmForget(false)}
                style={{ fontSize: '6px', padding: '3px 8px', color: '#8b7355', borderColor: 'rgba(139,94,60,0.4)', cursor: 'pointer' }}
              >NO</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button className="pixel-btn" onClick={() => setSelected(null)} style={{ fontSize: '6px', padding: '3px 8px' }}>◀ BACK</button>
            <button
              className="pixel-btn"
              onClick={() => setConfirmForget(true)}
              disabled={forgetting}
              style={{ fontSize: '6px', padding: '3px 8px', color: 'var(--red)', borderColor: 'var(--red)' }}
            >FORGET</button>
            {forgetError && (
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: 'var(--red)' }}>
                The skill resists being forgotten...
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
      {skills.map((skill) => (
        <div
          key={skill.name}
          onClick={() => setSelected(skill.name)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '3px 6px', cursor: 'pointer',
            borderLeft: `3px solid ${CAT_COLOR[skill.category || ''] || 'var(--border)'}`,
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,94,60,0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <SkillIcon name={skill.name} category={skill.category || ''} size={16} />
          <span style={{
            flex: 1, fontSize: '8px', color: 'var(--text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {skill.name}
          </span>
        </div>
      ))}
    </div>
  )
}
