import { useEffect, useRef } from 'react'
import { useStore } from './store'
import { API_URL } from './api'

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeFetch<T = any>(url: string, transform?: (data: any) => T): Promise<T | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`[fetch] ${url} returned ${res.status}`)
      return null
    }
    const data = await res.json()
    return transform ? transform(data) : data
  } catch (e) {
    console.warn(`[fetch] ${url} failed:`, e)
    return null
  }
}

function fetchInitialData() {
  const { setState, setSkills, setEvents, setKnowledgeMap, setQuests, setBagItems, setSites } = useStore.getState()
  safeFetch(`${API_URL}/api/state`).then(d => { if (d) setState(d) })
  safeFetch(`${API_URL}/api/skills`).then(d => { if (d) setSkills(d) })
  safeFetch(`${API_URL}/api/events`).then(d => { if (d) setEvents(d) })
  safeFetch(`${API_URL}/api/map`).then(d => { if (d) setKnowledgeMap(d) })
  safeFetch(`${API_URL}/api/quest/active`, d => d.quests || []).then(d => { if (d) setQuests(d) })
  safeFetch(`${API_URL}/api/bag/items`, d => d.items || []).then(d => { if (d) setBagItems(d) })
  safeFetch(`${API_URL}/api/sites`, d => d.sites || d).then(d => { if (d && Array.isArray(d)) setSites(d) })
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    fetchInitialData()

    let reconnectTimer: ReturnType<typeof setTimeout>
    let isMounted = true
    let reconnectDelay = 1000

    function connect() {
      if (!isMounted) return
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        reconnectDelay = 1000 // Reset backoff on successful connection
        useStore.getState().setConnected(true)
        fetchInitialData() // Refresh all data on reconnect
      }

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          const store = useStore.getState()
          if (msg.type === 'state') {
            store.setState(msg.data)
          } else if (msg.type === 'event') {
            store.addEvent(msg.data)
            if (['skill_drop', 'hub_acquire'].includes(msg.data.type)) {
              safeFetch(`${API_URL}/api/skills`).then(d => { if (d) store.setSkills(d) })
            }
          } else if (msg.type === 'map') {
            store.setKnowledgeMap(msg.data)
          } else if (msg.type === 'quest') {
            safeFetch(`${API_URL}/api/quest/active`, d => d.quests || []).then(d => { if (d) store.setQuests(d) })
          } else if (msg.type === 'bag') {
            safeFetch(`${API_URL}/api/bag/items`, d => d.items || []).then(d => { if (d) store.setBagItems(d) })
          } else if (msg.type === 'sites') {
            if (Array.isArray(msg.data)) store.setSites(msg.data)
          } else if (msg.type === 'skills_reclassified') {
            safeFetch(`${API_URL}/api/skills`).then(d => { if (d) store.setSkills(d) })
            safeFetch(`${API_URL}/api/sites`, d => d.sites || d).then(d => {
              if (d && Array.isArray(d)) store.setSites(d)
            })
          } else if (msg.type === 'classify_status') {
            store.setClassifying(msg.status === 'started')
            if (msg.status === 'completed') {
              // Refresh sites + map after classification
              safeFetch(`${API_URL}/api/sites`, d => d.sites || d).then(d => {
                if (d && Array.isArray(d)) store.setSites(d)
              })
              safeFetch(`${API_URL}/api/map`).then(d => { if (d) store.setKnowledgeMap(d) })
            }
          }
        } catch (e) {
          console.warn('[ws] Failed to process message:', e)
        }
      }

      ws.onclose = () => {
        useStore.getState().setConnected(false)
        if (isMounted) {
          reconnectTimer = setTimeout(connect, reconnectDelay)
          reconnectDelay = Math.min(reconnectDelay * 2, 30000)
        }
      }

      ws.onerror = () => ws.close()
    }

    connect()
    return () => {
      isMounted = false
      clearTimeout(reconnectTimer)
      wsRef.current?.close()
    }
  }, [])
}
