import { useState } from 'react'
import { useStore } from '../store'
import { ItemIcon } from '../utils/icons'
import { discardBagItem, fetchBagItemContent } from '../api'
import { formatDate } from '../utils/formatters'

const RARITY_COLOR: Record<string, string> = {
  common: '#6b7280',
  uncommon: 'var(--green)',
  rare: 'var(--cyan)',
  epic: 'var(--purple)',
  legendary: 'var(--gold)',
}

const RARITY_BG: Record<string, string> = {
  common: 'rgba(107,114,128,0.06)',
  uncommon: 'rgba(102,187,106,0.08)',
  rare: 'rgba(78,205,196,0.1)',
  epic: 'rgba(168,85,247,0.1)',
  legendary: 'rgba(240,230,140,0.12)',
}

export default function BagPanel() {
  const bagItems = useStore((s) => s.bagItems)
  const setBagItems = useStore((s) => s.setBagItems)
  const selectedBagItems = useStore((s) => s.selectedBagItems)
  const toggleBagItem = useStore((s) => s.toggleBagItem)
  const [hovered, setHovered] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState<string | null>(null)
  const [discarding, setDiscarding] = useState(false)
  const [viewContent, setViewContent] = useState<{ content: string; path: string } | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState<string | null>(null)

  if (bagItems.length === 0) {
    return (
      <div style={{ fontSize: '9px', color: '#7a6a5a', textAlign: 'center', padding: '12px' }}>
        Complete quests to discover items.
      </div>
    )
  }

  const detailItem = bagItems.find(i => i.id === detailId)
  const hoveredItem = !detailId ? bagItems.find(i => i.id === hovered) : null

  async function handleDiscard(itemId: string) {
    setDiscarding(true)
    try {
      await discardBagItem(itemId)
      // Remove from local state + clear from selection
      const current = useStore.getState().bagItems
      setBagItems(current.filter(i => i.id !== itemId))
      if (selectedBagItems.includes(itemId)) {
        toggleBagItem(itemId)
      }
      setDetailId(null)
      setConfirmDiscard(null)
    } catch (e) {
      console.error('Discard failed', e)
      // Don't remove locally on error — keep item visible
      setConfirmDiscard(null)
    }
    setDiscarding(false)
  }

  async function handleView(itemId: string) {
    setViewLoading(true)
    setViewError(null)
    try {
      const data = await fetchBagItemContent(itemId)
      setViewContent(data)
    } catch (e: unknown) {
      setViewError(e instanceof Error ? e.message : 'Failed to load content')
    }
    setViewLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '3px',
        padding: '2px',
      }}>
        {bagItems.map((item) => {
          const isSelected = selectedBagItems.includes(item.id)
          const isDetail = detailId === item.id
          const isHovered = hovered === item.id
          const color = RARITY_COLOR[item.rarity] || 'var(--border)'
          return (
            <div
              key={item.id}
              onClick={(e) => {
                if (e.shiftKey) {
                  toggleBagItem(item.id)
                } else {
                  setDetailId(detailId === item.id ? null : item.id)
                  setConfirmDiscard(null)
                  setViewContent(null)
                  setViewError(null)
                }
              }}
              onContextMenu={(e) => { e.preventDefault(); toggleBagItem(item.id) }}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: `1.5px solid ${isDetail ? '#f0e68c' : isSelected ? color : isHovered ? 'rgba(139,94,60,0.5)' : 'rgba(139,94,60,0.2)'}`,
                background: isDetail
                  ? 'rgba(240,230,140,0.1)'
                  : isSelected
                    ? RARITY_BG[item.rarity] || 'rgba(78,205,196,0.08)'
                    : isHovered ? 'rgba(20,14,8,0.4)' : 'rgba(10,8,4,0.3)',
                borderRadius: '2px',
                position: 'relative',
                transition: 'all 0.1s',
              }}
            >
              <ItemIcon item={item.icon || item.type || 'scroll'} size={28} />
              {/* Rarity dot */}
              <div style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: color,
              }} />
              {/* Selection check */}
              {isSelected && (
                <div style={{
                  position: 'absolute', top: '1px', left: '1px',
                  fontSize: '6px', color: 'var(--cyan)',
                  fontFamily: 'var(--font-pixel)',
                  lineHeight: 1,
                }}>*</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Item Detail Panel — expanded below grid */}
      {detailItem && (
        <div style={{
          padding: '8px',
          borderTop: '1px solid rgba(139,94,60,0.3)',
          background: 'rgba(20,14,8,0.5)',
        }}>
          {/* Confirm discard dialog */}
          {confirmDiscard === detailItem.id ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              padding: '8px',
            }}>
              <div style={{
                fontFamily: 'var(--font-pixel)', fontSize: '7px',
                color: '#ff6b6b', textAlign: 'center',
              }}>
                Discard {detailItem.name}?
              </div>
              <div style={{
                fontSize: '9px', color: '#8b7355', textAlign: 'center',
                fontStyle: 'italic',
              }}>
                This cannot be undone.
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => handleDiscard(detailItem.id)}
                  disabled={discarding}
                  style={{
                    fontFamily: 'var(--font-pixel)', fontSize: '5px',
                    padding: '3px 10px', cursor: discarding ? 'wait' : 'pointer',
                    background: 'rgba(255,107,107,0.2)', border: '1px solid #ff6b6b',
                    color: '#ff6b6b', transition: 'all 0.15s',
                  }}
                >{discarding ? '...' : 'YES, DISCARD'}</button>
                <button
                  onClick={() => setConfirmDiscard(null)}
                  style={{
                    fontFamily: 'var(--font-pixel)', fontSize: '5px',
                    padding: '3px 10px', cursor: 'pointer',
                    background: 'transparent', border: '1px solid rgba(139,94,60,0.4)',
                    color: '#8b7355', transition: 'all 0.15s',
                  }}
                >CANCEL</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* Large icon */}
              <div style={{
                flexShrink: 0, width: '48px', height: '48px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: RARITY_BG[detailItem.rarity] || 'rgba(10,8,4,0.3)',
                border: `1px solid ${RARITY_COLOR[detailItem.rarity] || 'rgba(139,94,60,0.3)'}`,
                borderRadius: '3px',
              }}>
                <ItemIcon item={detailItem.icon || detailItem.type || 'scroll'} size={40} />
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '8px',
                  color: RARITY_COLOR[detailItem.rarity] || 'var(--text)',
                  marginBottom: '2px',
                }}>
                  {detailItem.name}
                </div>
                <div style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '5px',
                  color: RARITY_COLOR[detailItem.rarity] || '#8b7355',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  marginBottom: '3px',
                }}>
                  {detailItem.rarity}{detailItem.type ? ` \u00b7 ${detailItem.type.replace(/_/g, ' ')}` : ''}
                </div>
                {detailItem.description && (
                  <div style={{
                    fontSize: '9px', color: '#c8a87a', lineHeight: '1.4',
                    fontFamily: 'Georgia, serif',
                    marginBottom: '3px',
                  }}>
                    {detailItem.description}
                  </div>
                )}
                {/* Meta info */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                  {detailItem.source_quest && (
                    <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: '#6b4c2a' }}>
                      QUEST: {detailItem.source_quest}
                    </span>
                  )}
                  {detailItem.created_at && (
                    <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: '#6b4c2a' }}>
                      {formatDate(detailItem.created_at)}
                    </span>
                  )}
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                  <button
                    onClick={() => handleView(detailItem.id)}
                    disabled={viewLoading}
                    style={{
                      fontFamily: 'var(--font-pixel)', fontSize: '5px',
                      padding: '3px 8px', cursor: viewLoading ? 'wait' : 'pointer',
                      background: 'rgba(78,205,196,0.15)', border: '1px solid var(--cyan)',
                      color: 'var(--cyan)', transition: 'all 0.15s',
                      letterSpacing: '0.5px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(78,205,196,0.25)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(78,205,196,0.15)' }}
                  >{viewLoading ? '...' : 'VIEW'}</button>
                  <button
                    onClick={() => {
                      const msg = `Look at this ${detailItem.name}: ${detailItem.description || ''}`
                      if (window.__hermesShowToNpc) {
                        window.__hermesShowToNpc(msg)
                      }
                    }}
                    style={{
                      fontFamily: 'var(--font-pixel)', fontSize: '5px',
                      padding: '3px 8px', cursor: 'pointer',
                      background: 'rgba(90,60,20,0.4)', border: '1px solid var(--gold)',
                      color: 'var(--gold)', transition: 'all 0.15s',
                      letterSpacing: '0.5px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,230,140,0.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(90,60,20,0.4)' }}
                  >SHOW TO NPC</button>
                  <button
                    onClick={() => setConfirmDiscard(detailItem.id)}
                    style={{
                      fontFamily: 'var(--font-pixel)', fontSize: '5px',
                      padding: '3px 8px', cursor: 'pointer',
                      background: 'transparent', border: '1px solid rgba(255,107,107,0.4)',
                      color: '#ff6b6b', transition: 'all 0.15s',
                      letterSpacing: '0.5px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >DISCARD</button>
                </div>
                {/* View error */}
                {viewError && (
                  <div style={{
                    marginTop: '6px', fontSize: '8px', color: '#ff6b6b',
                    fontFamily: 'var(--font-pixel)',
                  }}>
                    {viewError}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* File Content Viewer */}
          {viewContent && (
            <div style={{ marginTop: '8px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '4px',
              }}>
                <span style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '5px',
                  color: '#6b4c2a', letterSpacing: '0.5px',
                }}>
                  {viewContent.path.split('/').slice(-2).join('/')}
                </span>
                <button
                  onClick={() => { setViewContent(null); setViewError(null) }}
                  style={{
                    fontFamily: 'var(--font-pixel)', fontSize: '5px',
                    padding: '2px 6px', cursor: 'pointer',
                    background: 'transparent', border: '1px solid rgba(139,94,60,0.4)',
                    color: '#8b7355', transition: 'all 0.15s',
                  }}
                >CLOSE</button>
              </div>
              <div style={{
                maxHeight: '200px', overflow: 'auto',
                padding: '6px 8px',
                background: 'rgba(30,20,10,0.6)',
                border: '1px solid rgba(139,94,60,0.3)',
                borderRadius: '3px',
              }}>
                <pre style={{
                  margin: 0, padding: 0,
                  fontSize: '8px', lineHeight: '1.5',
                  color: '#c8a87a',
                  fontFamily: "'Courier New', monospace",
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {viewContent.content}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hover tooltip — only when no detail panel open */}
      {hoveredItem && (
        <div style={{
          padding: '4px 6px',
          borderTop: '1px solid rgba(139,94,60,0.2)',
        }}>
          <div style={{
            fontSize: '8px',
            fontFamily: 'var(--font-pixel)',
            color: RARITY_COLOR[hoveredItem.rarity] || 'var(--text)',
          }}>
            {hoveredItem.name}
          </div>
          {hoveredItem.description && (
            <div style={{
              fontSize: '8px',
              color: '#8b7355',
              marginTop: '1px',
              lineHeight: '1.3',
            }}>
              {hoveredItem.description.slice(0, 60)}
            </div>
          )}
          <div style={{
            fontSize: '5px',
            fontFamily: 'var(--font-pixel)',
            color: RARITY_COLOR[hoveredItem.rarity] || 'var(--text-dim)',
            marginTop: '2px',
          }}>
            {hoveredItem.rarity}
          </div>
        </div>
      )}

      {selectedBagItems.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
        }}>
          <div style={{
            fontSize: '7px', color: 'var(--cyan)',
            fontFamily: 'var(--font-pixel)', textAlign: 'center',
          }}>
            {selectedBagItems.length} selected
          </div>
          <button
            onClick={() => {
              const items = bagItems.filter(i => selectedBagItems.includes(i.id))
              const itemDesc = items.map(i => `[${i.name}]: ${i.description || i.type || 'an item'}`).join('; ')
              const msg = items.length === 1
                ? `Look at this ${items[0].name}: ${items[0].description || ''}`
                : `Look at these items: ${itemDesc}`
              if (window.__hermesShowToNpc) {
                window.__hermesShowToNpc(msg)
              }
            }}
            style={{
              fontFamily: 'var(--font-pixel)', fontSize: '5px',
              padding: '3px 8px', cursor: 'pointer',
              background: 'rgba(90,60,20,0.4)', border: '1px solid var(--gold)',
              color: 'var(--gold)', transition: 'all 0.15s',
              letterSpacing: '0.5px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,230,140,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(90,60,20,0.4)' }}
          >SHOW TO NPC</button>
        </div>
      )}
    </div>
  )
}
