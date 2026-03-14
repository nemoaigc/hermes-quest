import { useStore } from '../store'
import { ItemIcon } from '../utils/icons'

const RARITY_COLOR: Record<string, string> = {
  common: '#6b7280',
  rare: 'var(--cyan)',
  epic: 'var(--purple)',
  legendary: 'var(--gold)',
}

export default function BagPanel() {
  const bagItems = useStore((s) => s.bagItems)
  const selectedBagItems = useStore((s) => s.selectedBagItems)
  const toggleBagItem = useStore((s) => s.toggleBagItem)

  if (bagItems.length === 0) {
    return (
      <div style={{ fontSize: '9px', color: '#7a6a5a', textAlign: 'center', padding: '12px' }}>
        Complete quests to discover items.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {bagItems.map((item) => {
        const isSelected = selectedBagItems.includes(item.id)
        return (
          <div
            key={item.id}
            onClick={() => toggleBagItem(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 6px', cursor: 'pointer',
              borderLeft: `2px solid ${RARITY_COLOR[item.rarity] || 'var(--border)'}`,
              background: isSelected ? 'rgba(78,205,196,0.08)' : 'transparent',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = isSelected ? 'rgba(78,205,196,0.12)' : 'rgba(139,94,60,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'rgba(78,205,196,0.08)' : 'transparent' }}
          >
            <ItemIcon item={item.type} size={16} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '9px', color: isSelected ? 'var(--cyan)' : 'var(--text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {item.name}
              </div>
            </div>
            <span style={{
              fontFamily: 'var(--font-pixel)', fontSize: '4px',
              color: RARITY_COLOR[item.rarity] || 'var(--text-dim)',
            }}>
              {item.rarity}
            </span>
          </div>
        )
      })}

      {selectedBagItems.length > 0 && (
        <div style={{
          fontSize: '7px', color: 'var(--cyan)', marginTop: '4px',
          fontFamily: 'var(--font-pixel)', textAlign: 'center',
        }}>
          {selectedBagItems.length} selected
        </div>
      )}
    </div>
  )
}
