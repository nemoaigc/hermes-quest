// API endpoint paths — centralized to avoid hardcoded strings
import { API_URL } from '../api'

export const ENDPOINTS = {
  state: `${API_URL}/api/state`,
  questActive: `${API_URL}/api/quest/active`,
  questCreate: `${API_URL}/api/quest/create`,
  questCancel: `${API_URL}/api/quest/cancel`,
  questEdit: `${API_URL}/api/quest/edit`,
  questAccept: `${API_URL}/api/quest/accept`,
  quests: `${API_URL}/api/quests`,
  map: `${API_URL}/api/map`,
  cycleStart: `${API_URL}/api/cycle/start`,
  hubSearch: `${API_URL}/api/hub/search`,
  hubInstall: `${API_URL}/api/hub/install`,
  npcChat: `${API_URL}/api/npc/chat`,
  tavernAmbient: `${API_URL}/api/tavern/ambient`,
  tavernGenerate: `${API_URL}/api/tavern/generate`,
  tavernReply: `${API_URL}/api/tavern/reply`,
  rumorsFeed: `${API_URL}/api/rumors/feed`,
  skills: `${API_URL}/api/skills`,
  events: `${API_URL}/api/events`,
  bagItems: `${API_URL}/api/bag/items`,
  feedback: `${API_URL}/api/feedback`,
  potionUse: `${API_URL}/api/potion/use`,
  reflectionLatest: `${API_URL}/api/reflection/latest`,
} as const
