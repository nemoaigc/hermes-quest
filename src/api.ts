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

export { API_URL }
