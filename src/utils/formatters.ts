import type { GameEvent } from '../store'

const EVENT_CONFIG: Record<string, { color: string; format: (data: Record<string, unknown>) => string }> = {
  cycle_start: {
    color: 'var(--cyan)',
    format: (d) => `Hermes begins a new evolution cycle${d.trigger ? ` [${d.trigger}]` : ''}...`,
  },
  reflect: {
    color: 'var(--purple)',
    format: (d) => `Hermes meditates on weakness: ${(d.chosen_training_target as string) || (d.chosen as string) || (d.weaknesses ? (d.weaknesses as string[])[0] : '') || 'unknown'}...`,
  },
  train_start: {
    color: 'var(--gold)',
    format: (d) => `Training in ${(d.target as string) || (d.skill_name as string) || 'unknown'} — plan: ${(d.plan as string) || (d.method as string) || 'practice'}`,
  },
  train_fail: {
    color: 'var(--red)',
    format: (d) => `Training faltered: ${(d.reason as string) || 'unknown reason'}`,
  },
  skill_drop: {
    color: 'var(--green)',
    format: (d) => `New skill learned: ${(d.skill as string) || (d.skill_name as string) || 'unknown'} [${(d.rarity as string) || 'common'}]`,
  },
  xp_gain: {
    color: 'var(--green)',
    format: (d) => `Gained ${d.amount ?? 0} XP${d.reason ? ` — ${d.reason}` : ''}`,
  },
  level_up: {
    color: 'var(--gold)',
    format: (d) => `LEVEL UP! Hermes is now Lv.${(d.to as number) ?? (d.new_level as number) ?? '?'} (${(d.title as string) || (d.new_title as string) || 'Hero'})`,
  },
  boss_fight: {
    color: 'var(--red)',
    format: (d) => `Domain Challenge: ${(d.boss as string) || 'Unknown'} — ${d.result === 'victory' ? 'MASTERED!' : 'Needs more training...'} (${d.score ?? '?'}/100)`,
  },
  region_unlock: {
    color: 'var(--cyan)',
    format: (d) => `New skill domain unlocked!${d.reason ? ` (${d.reason})` : ''}`,
  },
  region_move: {
    color: 'var(--text)',
    format: (d) => `Domain shift: ${(d.from as string) || '?'} → ${(d.to as string) || '?'}`,
  },
  quest_accept: {
    color: 'var(--gold)',
    format: (d) => `Quest accepted: ${(d.title as string) || (d.quest_id as string) || 'Unknown Quest'}`,
  },
  quest_complete: {
    color: 'var(--green)',
    format: (d) => {
      const gold = (d.reward_gold as number) ?? (d.gold_gained as number) ?? 0
      const xp = (d.reward_xp as number) ?? (d.xp_gained as number) ?? 0
      const title = (d.title as string) || ''
      return `Quest conquered!${title ? ` "${title}"` : ''} Earned ${gold}G and ${xp} XP`
    },
  },
  quest_fail: {
    color: 'var(--red)',
    format: (d) => `Quest failed.${d.hp_lost ? ` -${d.hp_lost}HP` : ''}`,
  },
  class_shift: {
    color: 'var(--purple)',
    format: (d) => `Specialization shifted: ${(d.from as string) || '?'} → ${(d.to as string) || '?'}`,
  },
  item_use: {
    color: 'var(--cyan)',
    format: (d) => `Used ${(d.item as string) || 'item'}: ${(d.effect as string) || ''}${d.amount ? ` +${d.amount}` : ''}`,
  },
  hub_browse: {
    color: 'var(--text-dim)',
    format: (d) => `Browsed the Hub: "${(d.query as string) || ''}"${d.results_count !== undefined ? ` (${d.results_count} results)` : ''}`,
  },
  hub_acquire: {
    color: 'var(--purple)',
    format: (d) => `Acquired from Hub: ${(d.skill as string) || (d.skill_name as string) || 'unknown skill'}`,
  },
  telegram_sent: {
    color: 'var(--text-dim)',
    format: (d) => `Message sent via ${(d.target as string) || 'Telegram'}${d.message_id ? ` [#${d.message_id}]` : ''}`,
  },
  cycle_end: {
    color: 'var(--text-dim)',
    format: (d) => {
      const duration = (d.duration_seconds as number) ?? (d.duration_s as number) ?? 0
      const status = (d.status as string) || ''
      const skills = Array.isArray(d.skills_gained)
        ? (d.skills_gained as string[]).join(', ')
        : d.skills_gained ? String(d.skills_gained) : ''
      const parts = [`Cycle complete — ${duration}s`]
      if (status === 'success') parts.push('(success)')
      else if (status) parts.push(`(${status})`)
      if (skills) parts.push(`skills: ${skills}`)
      return parts.join(' ')
    },
  },
  cycle_skip: {
    color: 'var(--red)',
    format: (d) => `Cycle skipped: ${(d.reason as string) || 'unknown reason'}`,
  },
  workflow_discover: {
    color: 'var(--gold)',
    format: (d) => `New workflow discovered: ${(d.name as string) || (d.workflow as string) || 'unknown'}!`,
  },
  fog_appear: {
    color: 'var(--purple)',
    format: (d) => `Mysterious fog appeared: ${(d.hint as string) || 'something stirs...'}`,
  },
  fog_clear: {
    color: 'var(--cyan)',
    format: (d) => `Fog cleared! Revealed: ${(d.name as string) || 'new territory'}`,
  },
  user_feedback: {
    color: 'var(--gold)',
    format: (d) => `Adventurer feedback: ${(d.feedback_type as string) === 'positive' || (d.feedback_type as string) === 'up' ? '👍' : '👎'}${d.reason ? ` — ${d.reason}` : ''}`,
  },
  reflection_letter: {
    color: 'var(--purple)',
    format: () => `Hermes has written a reflection letter...`,
  },
  mp_change: {
    color: 'var(--cyan)',
    format: (d) => `Morale ${(d.delta as number) > 0 ? 'boosted' : 'drained'}: ${(d.delta as number) > 0 ? '+' : ''}${d.delta} MP${d.reason ? ` — ${d.reason}` : ''}`,
  },
  understanding_update: {
    color: 'var(--cyan)',
    format: (d) => {
      const val = (d.value as number) || 0
      // Backend sends 0-100 percentage; if < 1, treat as 0-1 fraction
      const pct = val > 1 ? Math.round(val) : Math.round(val * 100)
      return `Understanding updated: ${pct}%`
    },
  },
  positive_signal: {
    color: 'var(--green)',
    format: (d) => `Positive signal: ${(d.detail as string) || 'good progress'}`,
  },
  correction_signal: {
    color: 'var(--red)',
    format: (d) => `Correction needed: ${(d.detail as string) || 'adjustment required'}`,
  },
}

export function formatEvent(event: GameEvent) {
  const config = EVENT_CONFIG[event.type] || { color: 'var(--text-dim)', format: () => event.type }
  let text: string
  try {
    text = config.format(event.data as Record<string, unknown>)
  } catch {
    text = event.type
  }
  return {
    type: event.type,
    color: config.color,
    text,
  }
}

export function formatTime(ts: string): string {
  try {
    const d = new Date(ts)
    return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ts
  }
}
