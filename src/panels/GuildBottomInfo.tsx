import { useState, useEffect } from 'react'
import { useStore } from '../store'
import {
  createQuest as apiCreateQuest,
  cancelQuest as apiCancelQuest,
  editQuest as apiEditQuest,
  fetchActiveQuests,
  fetchAllQuests,
} from '../api'
import { formatDate } from '../utils/formatters'
import RpgButton from '../components/RpgButton'
import type { Quest } from '../types'

const TAB_CONFIG = [
  { key: 'active' as const, label: 'ACTIVE', color: '#66bb6a', dim: '#3a5a3a' },
  { key: 'completed' as const, label: 'DONE', color: '#4ecdc4', dim: '#3a5a5a' },
  { key: 'cancelled' as const, label: 'CANCELED', color: '#fdd835', dim: '#5a5a3a' },
  { key: 'failed' as const, label: 'FAILED', color: '#ff6b6b', dim: '#5a3a3a' },
] as const

/** GUILD bottom — quest ledger */
export default function GuildBottomInfo() {
  const quests = useStore((s) => s.quests)
  const setQuests = useStore((s) => s.setQuests)
  const [input, setInput] = useState('')
  const [creating, setCreating] = useState(false)
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState<string | null>(null)
  const [retryError, setRetryError] = useState<string | null>(null)
  const activeQuests = quests.filter((q) => q.status === 'active' || q.status === 'in_progress' || q.status === 'pending')

  async function refreshQuests() {
    try {
      const questData = await fetchActiveQuests()
      setQuests(questData.quests || [])
    } catch (e) { console.error('refreshQuests failed', e) }
  }

  async function createTask() {
    const title = input.trim()
    if (!title || creating) return
    setInput('')
    setCreating(true)
    try {
      await apiCreateQuest(title, 'user')
      await refreshQuests()
      setAllQuestsTrigger(t => t + 1)
    } catch (e) {
      console.error('createTask failed', e)
      setInput(title)
      setCreateError('Quest scroll was lost in transit...')
      setTimeout(() => setCreateError(null), 3000)
    }
    setCreating(false)
  }

  const [questTab, setQuestTab] = useState<'active' | 'completed' | 'cancelled' | 'failed'>('active')
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [editingQuest, setEditingQuest] = useState<string | null>(null)

  async function handleCancelQuest(questId: string) {
    setCancelling(questId)
    try {
      await apiCancelQuest(questId)
      await refreshQuests()
      setAllQuestsTrigger(t => t + 1)
    } catch (e) {
      console.error('cancelQuest failed', e)
      setCancelError(questId)
      setTimeout(() => setCancelError(null), 3000)
    }
    setCancelling(null)
  }

  async function retryQuest(title: string) {
    setRetrying(title)
    try {
      await apiCreateQuest(title, 'user', true)
      await refreshQuests()
      setAllQuestsTrigger(t => t + 1)
    } catch (e) {
      console.error('retryQuest failed', e)
      setRetryError(title)
      setTimeout(() => setRetryError(null), 3000)
    }
    setRetrying(null)
  }

  const [allQuests, setAllQuests] = useState<Quest[]>([])
  const [allQuestsTrigger, setAllQuestsTrigger] = useState(0)
  useEffect(() => {
    fetchAllQuests().then(d => setAllQuests(Array.isArray(d) ? d : [])).catch(e => console.error('allQuests fetch failed', e))
  }, [allQuestsTrigger])
  const completedQuests = allQuests.filter(q => q.status === 'completed')
  const cancelledQuests = allQuests.filter(q => q.status === 'cancelled')
  const failedQuests = allQuests.filter(q => q.status === 'failed')
  const tabQuests = questTab === 'active' ? activeQuests : questTab === 'completed' ? completedQuests : questTab === 'cancelled' ? cancelledQuests : failedQuests
  const tabColor = TAB_CONFIG.find(t => t.key === questTab)?.color || '#f0e68c'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Header: title + tabs inline */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        paddingBottom: '6px', marginBottom: '6px', flexShrink: 0,
        borderBottom: '1px solid rgba(107,76,42,0.3)',
      }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          {TAB_CONFIG.map(tab => {
            const count = tab.key === 'active' ? activeQuests.length : tab.key === 'completed' ? completedQuests.length : tab.key === 'cancelled' ? cancelledQuests.length : failedQuests.length
            const isActive = questTab === tab.key
            return (
              <button key={tab.key} onClick={() => setQuestTab(tab.key)} style={{
                fontFamily: 'var(--font-pixel)', fontSize: '5px', padding: '3px 8px',
                background: isActive ? 'rgba(90,60,20,0.35)' : 'transparent',
                border: `1px solid ${isActive ? tab.color + '50' : 'transparent'}`,
                borderRadius: '2px',
                color: isActive ? tab.color : tab.dim,
                cursor: 'pointer', letterSpacing: '1px',
                transition: 'all 0.15s',
              }}>
                {tab.label} {count > 0 ? `(${count})` : ''}
              </button>
            )
          })}
        </div>
      </div>

      {/* Quest list */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {tabQuests.length === 0 ? (
          <div style={{
            fontSize: '10px', color: '#5a4a3a', fontStyle: 'italic',
            fontFamily: 'Georgia, serif', padding: '12px', textAlign: 'center',
          }}>
            {questTab === 'active' ? 'The quest board is empty...' : questTab === 'completed' ? 'No conquered quests yet.' : questTab === 'cancelled' ? 'No abandoned quests.' : 'No fallen quests.'}
          </div>
        ) : tabQuests.map((q) => {
          const isExpanded = expandedQuest === q.id
          return (
            <div key={q.id}
              onClick={() => setExpandedQuest(isExpanded ? null : q.id)}
              style={{
                marginBottom: '2px', padding: '5px 8px',
                background: isExpanded ? 'rgba(90,60,20,0.15)' : 'transparent',
                borderLeft: `2px solid ${tabColor}40`,
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = 'rgba(90,60,20,0.08)' }}
              onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  {editingQuest === q.id ? (
                    <input
                      autoFocus
                      defaultValue={q.title}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value.trim()
                          if (val && val !== q.title) {
                            try { await apiEditQuest(q.id, val); await refreshQuests() }
                            catch (err) { console.error('quest edit failed', err) }
                          }
                          setEditingQuest(null)
                        } else if (e.key === 'Escape') setEditingQuest(null)
                      }}
                      onBlur={() => setEditingQuest(null)}
                      style={{
                        width: '100%', padding: '2px 4px', fontSize: '10px',
                        fontFamily: 'var(--font-pixel)',
                        background: 'rgba(10,8,4,0.8)', border: '1px solid #f0e68c',
                        color: '#f0e68c', outline: 'none',
                      }}
                    />
                  ) : (
                    <div style={{
                      fontSize: '10px',
                      color: questTab === 'active' ? '#e8d5b0' : questTab === 'completed' ? '#4ecdc4' : questTab === 'cancelled' ? '#7a7a7a' : '#ff8a8a',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      textDecoration: questTab === 'cancelled' ? 'line-through' : 'none',
                      opacity: questTab === 'cancelled' ? 0.6 : 1,
                    }}>{q.title || '(untitled)'}</div>
                  )}
                  <div style={{
                    fontSize: '5px', fontFamily: 'var(--font-pixel)',
                    color: q.source === 'user' ? '#8b7355' : '#6b6b4a', marginTop: '2px',
                  }}>
                    {q.source === 'user' ? 'POSTED BY YOU' : 'FROM THE GUILD'}
                  </div>
                </div>

                {/* Action buttons */}
                {questTab === 'active' && (
                  <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setEditingQuest(editingQuest === q.id ? null : q.id)} style={{
                      fontFamily: 'var(--font-pixel)', fontSize: '5px', padding: '3px 6px', cursor: 'pointer',
                      background: 'transparent', border: '1px solid rgba(139,94,60,0.3)',
                      color: '#8b7355', borderRadius: '2px', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#c8a87a'; e.currentTarget.style.color = '#c8a87a' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,94,60,0.3)'; e.currentTarget.style.color = '#8b7355' }}
                    >{editingQuest === q.id ? 'ESC' : 'EDIT'}</button>
                    <button onClick={() => handleCancelQuest(q.id)} disabled={cancelling === q.id} style={{
                      fontFamily: 'var(--font-pixel)', fontSize: '5px', padding: '3px 6px', cursor: 'pointer',
                      background: 'transparent', border: '1px solid rgba(255,107,107,0.3)',
                      color: '#cc5050', borderRadius: '2px', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff6b6b'; e.currentTarget.style.color = '#ff6b6b' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,107,107,0.3)'; e.currentTarget.style.color = '#cc5050' }}
                    >{cancelling === q.id ? '...' : cancelError === q.id ? 'FAILED' : 'CANCEL'}</button>
                  </div>
                )}
                {questTab === 'failed' && (
                  <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => retryQuest(q.title)} disabled={retrying === q.title} style={{
                      fontFamily: 'var(--font-pixel)', fontSize: '5px', padding: '3px 8px', cursor: 'pointer',
                      background: 'rgba(240,230,140,0.08)', border: '1px solid rgba(240,230,140,0.3)',
                      color: '#f0e68c', borderRadius: '2px', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,230,140,0.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(240,230,140,0.08)' }}
                    >{retrying === q.title ? '...' : retryError === q.title ? 'ERROR' : 'RETRY 50G'}</button>
                  </div>
                )}
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{
                  marginTop: '4px', padding: '4px 6px',
                  fontSize: '9px', color: '#c8a87a', lineHeight: '1.5',
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  borderTop: '1px solid rgba(107,76,42,0.2)',
                }}>
                  {q.description || <span style={{ color: '#5a4a3a' }}>No details recorded.</span>}
                  {(q.reward_xp || q.reward_gold || q.rank || q.completed_at) && (
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: '#8b7355', marginTop: '3px', fontStyle: 'normal' }}>
                      {q.reward_gold ? `${q.reward_gold}G` : ''}{q.reward_gold && q.reward_xp ? ' / ' : ''}{q.reward_xp ? `${q.reward_xp}XP` : ''}
                      {q.rank ? ` [${q.rank}]` : ''}
                      {q.completed_at && (
                        <span style={{ color: '#6a5a3a', marginLeft: '6px' }}>
                          {formatDate(q.completed_at)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quest creation input */}
      <div style={{
        display: 'flex', gap: '6px', flexShrink: 0, paddingTop: '6px',
        borderTop: '1px solid rgba(107,76,42,0.3)',
        alignItems: 'center',
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createTask()}
          placeholder="Write a new quest..."
          disabled={creating}
          style={{
            flex: 1, padding: '5px 8px',
            background: 'rgba(10,8,4,0.5)', border: '1px solid rgba(139,94,60,0.3)',
            color: '#e8d5b0', fontFamily: 'var(--font-pixel)', fontSize: '7px',
            outline: 'none', borderRadius: '2px', transition: 'border-color 0.15s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#f0e68c' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(139,94,60,0.3)' }}
        />
        <RpgButton onClick={createTask} disabled={creating || !input.trim()} small>
          {creating ? '...' : 'POST'}
        </RpgButton>
      </div>
      {createError && (
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: '#ff6b6b', padding: '2px 0', marginTop: '2px' }}>
          {createError}
        </div>
      )}
    </div>
  )
}
