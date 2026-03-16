import type { NpcChatRequest, NpcChatResponse } from './types'

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.host}`

export async function sendNpcChat(req: NpcChatRequest): Promise<NpcChatResponse> {
  const res = await fetch(`${API_URL}/api/npc/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`NPC chat failed: ${res.status}`)
  return res.json()
}

export async function acceptQuest(questId: string): Promise<{ quest_id: string; status: string }> {
  const res = await fetch(`${API_URL}/api/quest/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quest_id: questId }),
  })
  if (!res.ok) throw new Error(`Accept quest failed: ${res.status}`)
  return res.json()
}

export async function acceptFogQuest(fogRegionId: string): Promise<{ quest_id: string; status: string }> {
  const res = await fetch(`${API_URL}/api/quest/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fog_region_id: fogRegionId }),
  })
  if (!res.ok) throw new Error(`Accept fog quest failed: ${res.status}`)
  return res.json()
}

export async function fetchTavernAmbient(): Promise<{
  messages: Array<{ npc: string; name: string; text: string }>
  generated_at: string
}> {
  const res = await fetch(`${API_URL}/api/tavern/ambient`)
  if (!res.ok) throw new Error(`Tavern ambient failed: ${res.status}`)
  return res.json()
}

export async function generateTavernAmbient(): Promise<{
  messages: Array<{ npc: string; name: string; text: string }>
  generated_at: string
}> {
  const res = await fetch(`${API_URL}/api/tavern/generate`, { method: 'POST' })
  if (!res.ok) throw new Error(`Tavern generate failed: ${res.status}`)
  return res.json()
}

export async function fetchBagItemContent(itemId: string): Promise<{ content: string; path: string }> {
  const res = await fetch(`${API_URL}/api/bag/item/${encodeURIComponent(itemId)}/content`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `Fetch content failed: ${res.status}`)
  }
  return res.json()
}

export async function discardBagItem(itemId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/bag/discard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item_id: itemId }),
  })
  if (!res.ok) throw new Error(`Discard item failed: ${res.status}`)
}

export async function usePotion(type: 'hp_potion' | 'mp_potion'): Promise<{
  ok: boolean
  potion: string
  cost: number
  healed: number
  new_value: number
  gold_remaining: number
}> {
  const res = await fetch(`${API_URL}/api/potion/use`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `Potion use failed: ${res.status}`)
  }
  return res.json()
}

// Quest management
export async function createQuest(title: string, source = 'user', retry = false) {
  const res = await fetch(`${API_URL}/api/quest/create`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, source, retry }),
  })
  if (!res.ok) throw new Error(`Create quest failed: ${res.status}`)
  return res.json()
}

export async function cancelQuest(questId: string) {
  const res = await fetch(`${API_URL}/api/quest/cancel`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quest_id: questId }),
  })
  if (!res.ok) throw new Error(`Cancel quest failed: ${res.status}`)
  return res.json()
}

export async function failQuest(questId: string) {
  const res = await fetch(`${API_URL}/api/quest/fail`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quest_id: questId }),
  })
  if (!res.ok) throw new Error(`Fail quest failed: ${res.status}`)
  return res.json()
}

export async function editQuest(questId: string, title: string) {
  const res = await fetch(`${API_URL}/api/quest/edit`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quest_id: questId, title }),
  })
  if (!res.ok) throw new Error(`Edit quest failed: ${res.status}`)
  return res.json()
}

export async function fetchActiveQuests() {
  const res = await fetch(`${API_URL}/api/quest/active`)
  if (!res.ok) throw new Error(`Fetch quests failed: ${res.status}`)
  return res.json()
}

export async function fetchAllQuests() {
  const res = await fetch(`${API_URL}/api/quests`)
  if (!res.ok) throw new Error(`Fetch all quests failed: ${res.status}`)
  return res.json()
}

// Map
export async function fetchMap(refresh = false) {
  const url = refresh ? `${API_URL}/api/map?refresh=true` : `${API_URL}/api/map`
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Map fetch failed: ${res.status}`)
  }
  return res.json()
}

// Cycle
export async function startCycle() {
  const res = await fetch(`${API_URL}/api/cycle/start`, { method: 'POST' })
  if (!res.ok) throw new Error(`Cycle start failed: ${res.status}`)
  return res.json()
}

// Hub/Shop
export async function searchHub(query = '') {
  const res = await fetch(`${API_URL}/api/hub/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error(`Hub search failed: ${res.status}`)
  return res.json()
}

export async function installSkill(identifier: string) {
  const res = await fetch(`${API_URL}/api/hub/install`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier }),
  })
  if (!res.ok) throw new Error(`Install failed: ${res.status}`)
  const data = await res.json()
  if (data.status === 'error') throw new Error(data.message || 'Install failed')
  return data
}

// State
export async function updateState(updates: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/api/state/update`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error(`State update failed: ${res.status}`)
  return res.json()
}

// Sites
export async function fetchSites() {
  const res = await fetch(`${API_URL}/api/sites`)
  if (!res.ok) throw new Error(`Sites fetch: ${res.status}`)
  return res.json()
}

export async function defineSite(siteId: string, name: string) {
  const res = await fetch(`${API_URL}/api/sites/define`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ site_id: siteId, name }),
  })
  if (!res.ok) throw new Error(`Define site: ${res.status}`)
  return res.json()
}

export async function renameSite(siteId: string, name: string) {
  const res = await fetch(`${API_URL}/api/sites/rename`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ site_id: siteId, name }),
  })
  if (!res.ok) throw new Error(`Rename site: ${res.status}`)
  return res.json()
}

export async function deleteSite(siteId: string) {
  const res = await fetch(`${API_URL}/api/sites/delete`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ site_id: siteId }),
  })
  if (!res.ok) throw new Error(`Delete site: ${res.status}`)
  return res.json()
}

// Rumors
export async function searchRumors(query: string) {
  const res = await fetch(`${API_URL}/api/rumors/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error(`Rumors search: ${res.status}`)
  return res.json()
}

export { API_URL }
