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

  /* ---- State 1: NPC Gallery — Tavern residents board ---- */
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
      padding: '6px 8px',
    }}>
      {/* Title bar */}
      <div style={{
        textAlign: 'center', padding: '2px 0 6px', flexShrink: 0,
        borderBottom: '1px solid rgba(139,94,60,0.25)',
        marginBottom: '6px',
      }}>
        <span style={{
          fontFamily: 'var(--font-pixel)', fontSize: '8px',
          color: '#c8a87a', letterSpacing: '3px',
        }}>TAVERN RESIDENTS</span>
      </div>

      {/* NPC cards — horizontal scroll */}
      <div style={{
        display: 'flex', gap: '8px', flex: 1, minHeight: 0,
        overflowX: 'auto', overflowY: 'hidden',
        padding: '2px 0',
      }}>
        {NPCS.map((npc) => (
          <div
            key={npc.id}
            onClick={() => onNpcChat(npc.id)}
            style={{
              flex: '0 0 auto',
              width: 'clamp(70px, 15vw, 110px)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center',
              padding: '8px 6px',
              cursor: 'pointer',
              background: 'linear-gradient(180deg, rgba(45,32,18,0.7) 0%, rgba(30,22,12,0.8) 100%)',
              border: '1px solid rgba(139,94,60,0.3)',
              borderRadius: '4px',
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#f0e68c'
              e.currentTarget.style.boxShadow = '0 0 12px rgba(240,230,140,0.15), inset 0 0 20px rgba(240,230,140,0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(139,94,60,0.3)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {/* Portrait */}
            <img
              src={npc.img}
              alt={npc.name}
              style={{
                width: '90%', aspectRatio: '1',
                objectFit: 'cover',
                imageRendering: 'pixelated',
                borderRadius: '3px',
                border: '1px solid rgba(139,94,60,0.4)',
              }}
            />
            {/* Name */}
            <span style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '8px',
              color: '#f0e68c',
              marginTop: '6px',
              letterSpacing: '1px',
              textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            }}>
              {npc.name}
            </span>
            {/* Title */}
            <span style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '5px',
              color: '#8b7355',
              marginTop: '2px',
            }}>
              {npc.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
