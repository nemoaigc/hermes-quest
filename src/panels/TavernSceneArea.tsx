import { useState, useEffect } from 'react'
import BackButton from '../components/BackButton'
import RpgButton from '../components/RpgButton'
import TavernAmbientChat from '../components/TavernAmbientChat'
import AnimatedBg from '../components/AnimatedBg'

/** Tavern SCENE area — 3 modes: default / chatter / rumors */
export default function TavernSceneArea({ sceneMode, onSceneMode, rumors, rumorsLoading, rumorsError, rumorsQuery, onFetchRumors, onSearchRumors, gossipRefreshRef }: {
  sceneMode: 'default' | 'chatter' | 'rumors'
  onSceneMode: (mode: 'default' | 'chatter' | 'rumors') => void
  rumors: Array<{ id: string; text: string; author: string; handle: string; likes: number; time: string }>
  rumorsLoading: boolean
  rumorsError?: string | null
  rumorsQuery: string
  onFetchRumors: () => void
  onSearchRumors: (query: string) => void
  gossipRefreshRef: React.MutableRefObject<(() => void) | null>
}) {
  const dimmed = sceneMode !== 'default'
  const [searchInput, setSearchInput] = useState('')
  // Sync local input when parent query changes (e.g. cleared externally)
  useEffect(() => { setSearchInput(rumorsQuery) }, [rumorsQuery])
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <AnimatedBg prefix="tavern" fallback="/bg/npc-bg.png" style={{
        filter: dimmed ? 'brightness(0.25)' : 'none',
        transition: 'filter 0.3s',
      }} />

      {/* Tab bar at top — always visible */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
        display: 'flex',
      }}>
        {(['chatter', 'rumors'] as const).map(tab => {
          const active = sceneMode === tab
          return (
            <button
              key={tab}
              onClick={() => { onSceneMode(active ? 'default' : tab); if (tab === 'rumors' && !active) onFetchRumors() }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = '#c8a87a'; e.currentTarget.style.background = 'rgba(13,10,6,0.7)' } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = '#8b7355'; e.currentTarget.style.background = 'rgba(13,10,6,0.5)' } }}
              style={{
                flex: 1, padding: '8px 0',
                fontFamily: 'var(--font-pixel)', fontSize: '8px',
                letterSpacing: '2px',
                background: active ? 'rgba(13,10,6,0.85)' : 'rgba(13,10,6,0.5)',
                border: 'none',
                borderBottom: active ? '2px solid #f0e68c' : '2px solid transparent',
                color: active ? '#f0e68c' : '#8b7355',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tab.toUpperCase()}
            </button>
          )
        })}
      </div>

      {/* Chatter content */}
      {sceneMode === 'chatter' && (
        <div style={{ position: 'absolute', top: '32px', left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '4px 8px', flexShrink: 0,
          }}>
            <BackButton onClick={() => onSceneMode('default')} />
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: '#f0e68c', letterSpacing: '1px' }}>
              TAVERN CHATTER
            </span>
            <span style={{ flex: 1 }} />
            <RpgButton onClick={() => gossipRefreshRef.current?.()} small>NEW GOSSIP</RpgButton>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <TavernAmbientChat hideHeader refreshRef={gossipRefreshRef} />
          </div>
        </div>
      )}

      {/* Rumors content */}
      {sceneMode === 'rumors' && (
        <div style={{ position: 'absolute', top: '32px', left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '4px 8px', flexShrink: 0,
          }}>
            <BackButton onClick={() => onSceneMode('default')} />
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: '#f0e68c', letterSpacing: '1px' }}>
              {rumorsQuery ? `"${rumorsQuery}"` : 'REALM RUMORS'}
            </span>
            <span style={{ flex: 1 }} />
            <button
              onClick={onFetchRumors}
              disabled={rumorsLoading}
              style={{
                fontFamily: 'var(--font-pixel)', fontSize: '5px',
                padding: '3px 8px', cursor: rumorsLoading ? 'wait' : 'pointer',
                background: 'linear-gradient(180deg, #6a4428 0%, #4a2a14 50%, #3a2210 100%)',
                border: '2px solid #6b4c2a',
                color: '#f0e68c',
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
              }}
            >
              {rumorsLoading ? '...' : 'REFRESH'}
            </button>
          </div>
          {/* Search bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '2px 8px 4px', flexShrink: 0,
          }}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && searchInput.trim()) onSearchRumors(searchInput.trim()) }}
              placeholder="Search the whispers..."
              style={{
                flex: 1,
                fontFamily: 'var(--font-pixel)', fontSize: '7px',
                padding: '4px 8px',
                background: 'rgba(13,10,6,0.85)',
                border: '1px solid #6b4c2a',
                borderRadius: '2px',
                color: '#e8d5b0',
                outline: 'none',
                caretColor: '#f0e68c',
              }}
            />
            {rumorsQuery && (
              <button
                onClick={() => { setSearchInput(''); onFetchRumors() }}
                style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '7px',
                  padding: '3px 6px', cursor: 'pointer',
                  background: 'rgba(13,10,6,0.85)',
                  border: '1px solid #6b4c2a',
                  color: '#ff6b6b',
                  borderRadius: '2px',
                  lineHeight: 1,
                }}
                title="Clear search"
              >
                X
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '4px 10px' }}>
            {rumorsLoading ? (
              <div style={{
                textAlign: 'center', color: '#c8a87a', fontStyle: 'italic',
                fontSize: '10px', fontFamily: 'var(--font-pixel)',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                marginTop: '20px',
              }}>
                {rumorsQuery ? 'Searching...' : 'You lean in and listen...'}
              </div>
            ) : rumorsError ? (
              <div style={{
                textAlign: 'center', color: '#ff6b6b',
                fontSize: '6px', fontFamily: 'var(--font-pixel)',
                marginTop: '20px',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              }}>
                {rumorsError}
              </div>
            ) : rumors.length === 0 ? (
              <div style={{
                textAlign: 'center', color: '#5c4a2a',
                fontSize: '6px', fontFamily: 'var(--font-pixel)',
                marginTop: '20px', cursor: 'pointer',
              }} onClick={onFetchRumors}>
                {rumorsQuery ? 'No whispers match your query...' : 'No whispers yet... Click to listen.'}
              </div>
            ) : rumors.map((r) => (
              <a
                key={r.id}
                href={`https://x.com/${r.handle}/status/${r.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', textDecoration: 'none',
                  marginBottom: '6px', padding: '6px 8px',
                  background: 'rgba(26,18,10,0.85)',
                  border: '1px solid rgba(139,94,60,0.4)',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f0e68c' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(139,94,60,0.4)' }}
              >
                <div style={{
                  fontSize: '9px', color: '#e8d5b0', lineHeight: '1.4',
                  fontFamily: 'var(--font-pixel)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}>
                  "{r.text.length > 150 ? r.text.slice(0, 150) + '...' : r.text}"
                </div>
                <div style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '5px',
                  color: '#8b7355', marginTop: '2px',
                  display: 'flex', gap: '8px',
                }}>
                  <span>-- @{r.handle}</span>
                  <span style={{ color: '#6b4c2a' }}>{r.likes} likes</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
