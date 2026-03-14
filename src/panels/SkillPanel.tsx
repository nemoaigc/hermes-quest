import { useStore } from '../store'
import SkillInventory from './SkillInventory'

export default function SkillPanel() {
  const allSkills = useStore((s) => s.skills)
  const skills = allSkills.filter(s => s.name && s.name.trim())

  return (
    <div className="pixel-panel" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="pixel-panel-title" style={{ textAlign: 'center' }}>SKILLS ({skills.length})</div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <SkillInventory />
      </div>
    </div>
  )
}
