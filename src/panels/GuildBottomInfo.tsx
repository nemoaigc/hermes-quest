import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { API_URL } from '../api'

/** GUILD bottom — task list with DONE buttons */
export default function GuildBottomInfo() {
  const quests = useStore((s) => s.quests)
  const setQuests = useStore((s) => s.setQuests)
  const setKnowledgeMap = useStore((s) => s.setKnowledgeMap)
  const [input, setInput] = useState('')
  const [creating, setCreating] = useState(false)
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [failing, setFailing] = useState<string | null>(null)
  const [failError, setFailError] = useState<string | null>(null)
  const activeQuests = quests.filter((q) => q.status === 'active' || q.status === 'in_progress' || q.status === 'pending')

  async function refreshQuests() {
    try {
      const [questRes, mapRes] = await Promise.all([
        fetch(`${API_URL}/api/quest/active`),
        fetch(`${API_URL}/api/map`),
      ])
      if (questRes.ok) {
        const d = await questRes.json()
        setQuests(d.quests || [])
      }
      if (mapRes.ok) {
        const d = await mapRes.json()
        setKnowledgeMap(d)
      }
    } catch (e) { console.error('refreshQuests failed', e) }
  }

  async function createTask() {
    const title = input.trim()
    if (!title || creating) return
    setInput('')
    setCreating(true)
    try {
      const res = await fetch(`${API_URL}/api/quest/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, source: 'user' }) })
      if (!res.ok) throw new Error(`Create failed: ${res.status}`)
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

  const [questTab, setQuestTab] = useState<'active' | 'cancelled' | 'failed'>('active')
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [editingQuest, setEditingQuest] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  async function cancelQuest(questId: string) {
    setCancelling(questId)
    try {
      const res = await fetch(`${API_URL}/api/quest/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quest_id: questId }) })
      if (!res.ok) throw new Error(`Cancel failed: ${res.status}`)
      await refreshQuests()
      setAllQuestsTrigger(t => t + 1)
    } catch (e) {
      console.error('cancelQuest failed', e)
      setCancelError(questId)
      setTimeout(() => setCancelError(null), 3000)
    }
    setCancelling(null)
  }

  async function failQuest(questId: string) {
    setFailing(questId)
    try {
      const res = await fetch(`${API_URL}/api/quest/fail`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quest_id: questId }) })
      if (!res.ok) throw new Error(`Fail failed: ${res.status}`)
      await refreshQuests()
      setAllQuestsTrigger(t => t + 1)
    } catch (e) {
      console.error('failQuest failed', e)
      setFailError(questId)
      setTimeout(() => setFailError(null), 3000)
    }
    setFailing(null)
  }

  // Fetch all quests (including done/cancelled) for tab display
  const [allQuests, setAllQuests] = useState<any[]>([])
  const [allQuestsTrigger, setAllQuestsTrigger] = useState(0)
  useEffect(() => {
    fetch(`${API_URL}/api/quests`).then(r => { if (!r.ok) throw new Error(`Quests fetch: ${r.status}`); return r.json() }).then(d => setAllQuests(Array.isArray(d) ? d : [])).catch(e => console.error('allQuests fetch failed', e))
  }, [allQuestsTrigger])
  const cancelledQuests = allQuests.filter(q => q.status === 'cancelled')
  const failedQuests = allQuests.filter(q => q.status === 'failed')

  const tabQuests = questTab === 'active' ? activeQuests : questTab === 'cancelled' ? cancelledQuests : failedQuests

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Tabs: ACTIVE / CANCELLED / FAILED */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px', flexShrink: 0 }}>
        {(['active', 'cancelled', 'failed'] as const).map(tab => (
          <button key={tab} onClick={() => setQuestTab(tab)} style={{
            fontFamily: 'var(--font-pixel)', fontSize: '6px', padding: '2px 6px',
            background: questTab === tab ? 'rgba(90,60,20,0.5)' : 'transparent',
            border: 'none', borderBottom: questTab === tab ? '2px solid #f0e68c' : '2px solid transparent',
            color: questTab === tab ? '#f0e68c' : '#8b7355', cursor: 'pointer',
            letterSpacing: '1px',
          }}>
            {tab.toUpperCase()} ({tab === 'active' ? activeQuests.length : tab === 'cancelled' ? cancelledQuests.length : failedQuests.length})
          </button>
        ))}
      </div>

      {/* Scrollable quest list */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {tabQuests.length === 0 ? (
          <div style={{ fontSize: '10px', color: '#6a5a3a', fontStyle: 'italic', fontFamily: 'Georgia, serif', padding: '8px' }}>
            {questTab === 'active' ? 'No active quests.' : questTab === 'cancelled' ? 'No cancelled quests.' : 'No failed quests.'}
          </div>
        ) : tabQuests.map((q) => {
          const isExpanded = expandedQuest === q.id
          return (
          <div key={q.id} style={{
            marginBottom: '3px', fontSize: '10px', padding: '3px 6px',
            borderLeft: `3px solid ${questTab === 'active' ? '#f0e68c' : questTab === 'cancelled' ? '#6b7280' : '#ff6b6b'}`,
            cursor: 'pointer',
            background: isExpanded ? 'rgba(90,60,20,0.15)' : 'transparent',
            transition: 'background 0.1s',
          }}
          onClick={() => setExpandedQuest(isExpanded ? null : q.id)}
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
                        try {
                          const res = await fetch(`${API_URL}/api/quest/edit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quest_id: q.id, title: val }) })
                          if (!res.ok) throw new Error(`Edit failed: ${res.status}`)
                          await refreshQuests()
                        } catch (err) { console.error('quest edit failed', err) }
                      }
                      setEditingQuest(null)
                    } else if (e.key === 'Escape') setEditingQuest(null)
                  }}
                  onBlur={() => setEditingQuest(null)}
                  style={{
                    width: '100%', padding: '2px 4px', fontSize: '10px',
                    fontFamily: 'var(--font-pixel)',
                    background: 'rgba(10,8,4,0.8)', border: '1px solid #38bdf8',
                    color: '#f0e68c', outline: 'none',
                  }}
                />
              ) : (
                <div style={{
                  color: questTab === 'active' ? '#e8d5b0' : questTab === 'cancelled' ? '#7a7a7a' : '#ff8a8a',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  textDecoration: questTab === 'cancelled' ? 'line-through' : 'none',
                  opacity: questTab === 'cancelled' ? 0.6 : 1,
                }}>{q.title || '(untitled)'}</div>
              )}
              <div style={{ fontSize: '5px', color: '#8b7355', fontFamily: 'var(--font-pixel)', marginTop: '1px' }}>{q.source === 'user' ? 'YOU' : 'AGENT'}</div>
            </div>
            {questTab === 'active' && (
              <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setEditingQuest(editingQuest === q.id ? null : q.id)} style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '5px', padding: '2px 5px', cursor: 'pointer',
                  background: editingQuest === q.id ? 'rgba(56,152,236,0.15)' : 'transparent',
                  border: '1px solid rgba(56,152,236,0.5)', color: '#38bdf8', borderRadius: '2px',
                }}>{editingQuest === q.id ? 'ESC' : 'EDIT'}</button>
                <button onClick={() => failQuest(q.id)} disabled={failing === q.id} style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '5px', padding: '2px 5px', cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(255,140,50,0.4)', color: '#ff8c32', borderRadius: '2px',
                }}>{failing === q.id ? '...' : failError === q.id ? 'ERROR' : 'FAIL'}</button>
                <button onClick={() => cancelQuest(q.id)} disabled={cancelling === q.id} style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '5px', padding: '2px 5px', cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(255,107,107,0.4)', color: '#ff6b6b', borderRadius: '2px',
                }}>{cancelling === q.id ? '...' : cancelError === q.id ? 'FAILED' : 'CANCEL'}</button>
              </div>
            )}
            </div>
            {/* Expanded description */}
            {isExpanded && q.description && (
              <div style={{
                marginTop: '4px', padding: '4px 6px',
                fontSize: '9px', color: '#c8a87a', lineHeight: '1.5',
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                borderTop: '1px solid rgba(107,76,42,0.3)',
              }}>
                {q.description}
                {(q.reward_xp || q.reward_gold) && (
                  <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: '#8b7355', marginTop: '3px', fontStyle: 'normal' }}>
                    {q.reward_gold ? `${q.reward_gold}G` : ''}{q.reward_gold && q.reward_xp ? ' / ' : ''}{q.reward_xp ? `${q.reward_xp}XP` : ''}
                    {q.rank ? ` [${q.rank}]` : ''}
                  </div>
                )}
              </div>
            )}
          </div>
          )
        })}
      </div>

      {/* Fixed input at bottom */}
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0, paddingTop: '4px', borderTop: '1px solid rgba(107,76,42,0.3)' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createTask()}
          placeholder="New quest..."
          disabled={creating}
          style={{
            flex: 1, padding: '5px 8px',
            background: 'rgba(10,8,4,0.6)', border: '1px solid #5c3a1e',
            color: '#e8d5b0', fontFamily: 'var(--font-pixel)', fontSize: '8px',
            outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#f0e68c' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#5c3a1e' }}
        />
        <button
          onClick={createTask}
          disabled={creating || !input.trim()}
          style={{
            fontFamily: 'var(--font-pixel)', fontSize: '5px',
            padding: '4px 10px', cursor: creating ? 'wait' : 'pointer',
            background: creating ? 'rgba(10,8,4,0.5)' : 'linear-gradient(180deg, #6a4428 0%, #4a2a14 50%, #3a2210 100%)',
            border: '2px solid #6b4c2a',
            color: '#f0e68c',
            boxShadow: creating ? 'none' : '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,220,140,0.1)',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
          }}
        >{creating ? '...' : 'POST'}</button>
      </div>
      {createError && (
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: '#ff6b6b', padding: '2px 6px' }}>
          {createError}
        </div>
      )}
    </div>
  )
}
