import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { sendNpcChat } from '../api'
import { NPC_PORTRAITS } from '../utils/npc-portraits'
import type { NpcId, TabId } from '../types'

const TAB_TO_NPC: Record<TabId, NpcId> = {
  map: 'cartographer',
  guild: 'guild_master',
  shop: 'quartermaster',
}

const NPC_NAMES: Record<NpcId, string> = {
  guild_master: 'Guild Master',
  cartographer: 'Cartographer',
  quartermaster: 'Quartermaster',
}

const NPC_IDS: NpcId[] = ['guild_master', 'cartographer', 'quartermaster']

export default function NPCDialogBar() {
  const activeTab = useStore((s) => s.activeTab)
  const npcChat = useStore((s) => s.npcChat)
  const selectedBagItems = useStore((s) => s.selectedBagItems)
  const selectedRegion = useStore((s) => s.selectedRegion)
  const addNpcMessage = useStore((s) => s.addNpcMessage)
  const setNpcLoading = useStore((s) => s.setNpcLoading)

  const [activeNpc, setActiveNpc] = useState<NpcId>(TAB_TO_NPC[activeTab])
  const [input, setInput] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)

  // Auto-switch NPC when tab changes
  useEffect(() => {
    setActiveNpc(TAB_TO_NPC[activeTab])
  }, [activeTab])

  // Auto-scroll dialog
  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.scrollTop = dialogRef.current.scrollHeight
    }
  }, [npcChat.messages])

  async function handleSend() {
    const msg = input.trim()
    if (!msg || npcChat.loading) return
    setInput('')
    addNpcMessage('user', msg)
    setNpcLoading(true)

    try {
      const res = await sendNpcChat({
        npc: activeNpc,
        message: msg,
        context: {
          active_tab: activeTab,
          selected_bag_items: selectedBagItems,
          selected_region: selectedRegion,
        },
      })
      addNpcMessage('npc', res.reply, res.actions)
    } catch {
      addNpcMessage('npc', 'The guild is quiet... (connection lost)')
    }
    setNpcLoading(false)
  }

  return (
    <div style={{
      background: 'linear-gradient(180deg, #1a140c 0%, #0d0a08 100%)',
      border: '2px solid #5c3a1e',
      borderTop: '3px solid #8b5e3c',
      padding: '6px',
    }}>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
        {/* NPC portrait selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NPC_IDS.map((id) => {
            const P = NPC_PORTRAITS[id]
            const isActive = id === activeNpc
            return (
              <div
                key={id}
                onClick={() => setActiveNpc(id)}
                title={NPC_NAMES[id]}
                style={{
                  cursor: 'pointer',
                  padding: '2px',
                  border: `2px solid ${isActive ? '#f0e68c' : '#3a2a1a'}`,
                  background: isActive ? 'rgba(240,230,140,0.1)' : 'transparent',
                }}
              >
                <P size={24} />
              </div>
            )
          })}
        </div>

        {/* Dialog area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* NPC name */}
          <div style={{
            fontFamily: 'var(--font-pixel)', fontSize: '7px',
            color: '#f0e68c', letterSpacing: '1px',
          }}>
            {NPC_NAMES[activeNpc]}
          </div>

          {/* Message history */}
          <div
            ref={dialogRef}
            style={{
              maxHeight: '80px', overflow: 'auto',
              background: '#0a0804', border: '1px solid #3a2a1a',
              padding: '4px', fontSize: '10px', lineHeight: '1.4',
            }}
          >
            {npcChat.messages.length === 0 ? (
              <div style={{ color: '#7a6a5a', fontStyle: 'italic' }}>
                Click to speak with {NPC_NAMES[activeNpc]}...
              </div>
            ) : (
              npcChat.messages.map((msg, i) => (
                <div key={i} style={{
                  marginBottom: '3px',
                  color: msg.role === 'user' ? '#c8a87a' : '#e8e6f0',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-pixel)', fontSize: '6px',
                    color: msg.role === 'user' ? '#8a889a' : '#f0e68c',
                    marginRight: '4px',
                  }}>
                    {msg.role === 'user' ? 'YOU' : NPC_NAMES[activeNpc].toUpperCase()}:
                  </span>
                  {msg.content}
                </div>
              ))
            )}
            {npcChat.loading && (
              <div style={{ color: '#7a6a5a', fontStyle: 'italic' }}>...</div>
            )}
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Speak to ${NPC_NAMES[activeNpc]}...`}
              disabled={npcChat.loading}
              style={{
                flex: 1, padding: '4px 6px',
                background: '#0a0804', border: '1px solid #3a2a1a',
                color: '#c8a87a', fontFamily: 'var(--font-mono)', fontSize: '10px',
              }}
            />
            <button
              className="pixel-btn"
              onClick={handleSend}
              disabled={npcChat.loading || !input.trim()}
              style={{
                fontSize: '7px', borderColor: '#5c3a1e',
                color: '#f0e68c', padding: '4px 8px',
                background: 'rgba(90,60,20,0.4)',
              }}
            >
              SEND
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
