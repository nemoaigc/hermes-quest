import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendNpcChat, acceptQuest } from '../api'

describe('api helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sendNpcChat sends correct request shape', async () => {
    const mockResponse = {
      reply: 'Welcome!',
      actions: [],
      npc_mood: 'friendly' as const,
    }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const result = await sendNpcChat({
      npc: 'guild_master',
      message: 'Hello',
      context: { active_tab: 'guild', selected_bag_items: [], selected_region: null },
    })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/npc/chat'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )
    expect(result).toEqual(mockResponse)
  })

  it('acceptQuest sends quest_id', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ quest_id: 'q-1', status: 'active' }),
    })

    const result = await acceptQuest('rec-quest-1')
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/quest/accept'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(result.quest_id).toBe('q-1')
  })
})
