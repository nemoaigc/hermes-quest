import { useStore } from '../store'

const RARITY_COLOR: Record<string, string> = {
  common: '#6b7280',
  rare: 'var(--cyan)',
  epic: 'var(--purple)',
  legendary: 'var(--gold)',
}

function BagItemIcon({ type, size = 16 }: { type: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      {type === 'research_note' && <>
        <rect x="3" y="1" width="10" height="14" fill="#f5f5dc" />
        <rect x="3" y="1" width="10" height="2" fill="#daa520" />
        <rect x="5" y="5" width="6" height="1" fill="#8b7355" />
        <rect x="5" y="7" width="6" height="1" fill="#8b7355" />
        <rect x="5" y="9" width="4" height="1" fill="#8b7355" />
      </>}
      {type === 'training_report' && <>
        <rect x="2" y="2" width="12" height="12" fill="#2a4a6a" />
        <rect x="3" y="3" width="10" height="10" fill="#1a3a5a" />
        <rect x="5" y="5" width="2" height="5" fill="#4ecdc4" />
        <rect x="8" y="3" width="2" height="7" fill="#00ff88" />
        <rect x="11" y="6" width="2" height="4" fill="#ffe66d" />
      </>}
      {type === 'code_snippet' && <>
        <rect x="2" y="2" width="12" height="12" fill="#1a1a2e" />
        <rect x="3" y="4" width="3" height="1" fill="#a855f7" />
        <rect x="5" y="6" width="5" height="1" fill="#00ff88" />
        <rect x="4" y="8" width="4" height="1" fill="#4ecdc4" />
        <rect x="3" y="10" width="6" height="1" fill="#ff6b6b" />
      </>}
      {type === 'map_fragment' && <>
        <rect x="2" y="2" width="12" height="12" fill="#2a1f14" rx="1" />
        <rect x="4" y="4" width="3" height="3" fill="#5c3a1e" />
        <rect x="9" y="5" width="2" height="4" fill="#4a6fa5" />
        <line x1="5" y1="10" x2="10" y2="8" stroke="#8b7355" strokeWidth="0.8" />
      </>}
    </svg>
  )
}

export default function BagPanel() {
  const bagItems = useStore((s) => s.bagItems)
  const selectedBagItems = useStore((s) => s.selectedBagItems)
  const toggleBagItem = useStore((s) => s.toggleBagItem)

  return (
    <div>
      {bagItems.length === 0 ? (
        <div style={{ fontSize: '9px', color: '#7a6a5a', textAlign: 'center', padding: '12px' }}>
          Complete quests to discover items.
        </div>
      ) : (
        <div className="skill-grid">
          {bagItems.map((item) => {
            const isSelected = selectedBagItems.includes(item.id)
            return (
              <div
                key={item.id}
                className={`skill-slot rarity-${item.rarity}`}
                title={`${item.name}\n${item.description}`}
                onClick={() => toggleBagItem(item.id)}
                style={{
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(78,205,196,0.15)' : '#0a0a12',
                  borderColor: isSelected ? 'var(--cyan)' : RARITY_COLOR[item.rarity] || '#3a3850',
                  boxShadow: isSelected ? '0 0 8px rgba(78,205,196,0.3)' : undefined,
                }}
              >
                <BagItemIcon type={item.type} size={18} />
              </div>
            )
          })}
        </div>
      )}

      {selectedBagItems.length > 0 && (
        <div style={{
          fontSize: '8px', color: 'var(--cyan)', marginTop: '4px',
          fontFamily: 'var(--font-pixel)',
        }}>
          {selectedBagItems.length} item(s) selected — mention in NPC chat
        </div>
      )}
    </div>
  )
}
