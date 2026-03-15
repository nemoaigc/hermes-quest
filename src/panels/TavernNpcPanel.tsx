import { NPCS, NPC_BIOS } from '../constants/npc'
import BackButton from '../components/BackButton'
import RpgDialogInline from './RpgDialogInline'

/** Tavern BOTTOM panel — 3 states: NPC gallery / NPC bio card / NPC chat */
export default function TavernNpcPanel({ activeNpc, onNpcSelect, chatNpc, onNpcChat, onCloseBio, onCloseChat, chatHistoryRef, npcPrefill }: {
  activeNpc: string | null
  onNpcSelect: (id: string) => void
  chatNpc: string | null
  onNpcChat: (id: string) => void
  onCloseBio: () => void
  onCloseChat: () => void
  chatHistoryRef: React.MutableRefObject<Record<string, Array<{ role: 'npc' | 'user'; text: string }>>>
  npcPrefill?: string | null
}) {
  const selectedNpcData = activeNpc ? NPCS.find(n => n.id === activeNpc) : null
  const chatNpcData = chatNpc ? NPCS.find(n => n.id === chatNpc) : null
  const bio = activeNpc ? NPC_BIOS[activeNpc] : null

  /* ---- State 3: NPC Chat ---- */
  if (chatNpc && chatNpcData) {
    return (
      <div style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <RpgDialogInline npc={chatNpcData} onClose={onCloseChat} chatHistoryRef={chatHistoryRef} prefillMessage={npcPrefill} />
      </div>
    )
  }

  /* ---- State 2: NPC Bio Card (old horizontal layout) ---- */
  if (activeNpc && selectedNpcData && bio) {
    return (
      <div style={{
        display: 'flex', gap: '12px', width: '100%', height: '100%', padding: '8px 12px',
      }}>
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <img src={selectedNpcData.img} alt="" style={{
            width: '80px', height: '80px', imageRendering: 'pixelated',
            borderRadius: '3px',
          }} />
          <BackButton onClick={onCloseBio} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'auto' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: '#f0e68c', letterSpacing: '1px' }}>
              {selectedNpcData.name}
            </div>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: '#8b7355', marginTop: '2px' }}>
              {selectedNpcData.title}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: 'var(--cyan)', letterSpacing: '0.5px' }}>
            {bio.trait}
          </div>
          <div style={{
            fontSize: '13px', color: '#c8a87a', lineHeight: '1.7',
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
          }}>
            "{bio.lore}"
          </div>
        </div>
      </div>
    )
  }

  /* ---- State 1: NPC Gallery ---- */
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
    }}>
      {/* Ornamental title */}
      <div style={{
        textAlign: 'center', padding: '4px 0 2px', flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 'clamp(5px, 0.7vw, 8px)', color: '#8b6a3c' }}>{'\u2554'} </span>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 'clamp(6px, 0.8vw, 9px)', color: '#f0e68c', letterSpacing: '2px' }}>RESIDENTS</span>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 'clamp(5px, 0.7vw, 8px)', color: '#8b6a3c' }}> {'\u2557'}</span>
      </div>
      <div style={{
        display: 'flex', flex: 1, minHeight: 0,
      }}>
      {NPCS.map((npc) => {
        const isActive = activeNpc === npc.id
        return (
          <div
            key={npc.id}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: isActive
                ? 'linear-gradient(180deg, rgba(50,35,20,0.6) 0%, rgba(35,25,15,0.7) 100%)'
                : 'linear-gradient(180deg, rgba(40,28,16,0.5) 0%, rgba(28,20,12,0.6) 100%)',
              border: '1px solid rgba(139,94,60,0.3)',
              borderTop: '1px solid rgba(180,140,80,0.15)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3), 0 1px 0 rgba(139,94,60,0.1)',
              borderRadius: '2px',
              margin: '2px',
              padding: '4px 2px',
              overflow: 'hidden',
            }}
          >
            <img
              src={npc.img}
              alt={npc.name}
              onClick={() => onNpcSelect(npc.id)}
              onMouseEnter={(e) => { e.currentTarget.style.border = '2px solid #f0e68c'; e.currentTarget.style.transform = 'scale(1.05)' }}
              onMouseLeave={(e) => { e.currentTarget.style.border = 'none'; e.currentTarget.style.transform = 'scale(1)' }}
              style={{
                width: '100%', maxWidth: '80px', aspectRatio: '1',
                objectFit: 'cover',
                imageRendering: 'pixelated',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            />
            <span style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: 'clamp(5px, 0.7vw, 7px)',
              color: isActive ? '#f0e68c' : '#c8a87a',
              marginTop: '3px',
              letterSpacing: '0.5px',
            }}>
              {npc.name}
            </span>
            <span style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: 'clamp(4px, 0.5vw, 5px)',
              color: '#6a5a3a',
            }}>
              {npc.title}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onNpcChat(npc.id) }}
              style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: 'clamp(4px, 0.5vw, 6px)',
                padding: '3px 10px',
                marginTop: '4px',
                cursor: 'pointer',
                background: isActive
                  ? 'linear-gradient(180deg, #7a5030 0%, #5a3820 100%)'
                  : 'transparent',
                border: isActive ? '1px solid #f0e68c' : '1px solid rgba(139,94,60,0.4)',
                color: isActive ? '#f0e68c' : '#8b7355',
                borderRadius: '2px',
                letterSpacing: '1px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f0e68c'; e.currentTarget.style.color = '#f0e68c' }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.borderColor = 'rgba(139,94,60,0.4)'; e.currentTarget.style.color = '#8b7355' } }}
            >
              CHAT
            </button>
          </div>
        )
      })}
      </div>
    </div>
  )
}
