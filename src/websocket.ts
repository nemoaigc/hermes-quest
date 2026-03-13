import { useEffect, useRef } from 'react'
import { useStore } from './store'

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.host}`

function fetchInitialData() {
  const { setState, setSkills, setEvents, setKnowledgeMap, setQuests, setBagItems } = useStore.getState()
  fetch(`${API_URL}/api/state`).then(r => r.json()).then(setState).catch(() => {})
  fetch(`${API_URL}/api/skills`).then(r => r.json()).then(setSkills).catch(() => {})
  fetch(`${API_URL}/api/events`).then(r => r.json()).then(setEvents).catch(() => {})
  fetch(`${API_URL}/api/map`).then(r => {
    if (r.ok) return r.json()
    return null
  }).then(data => { if (data) setKnowledgeMap(data) }).catch(() => {})
  fetch(`${API_URL}/api/quest/active`).then(r => r.json()).then(d => setQuests(d.quests || [])).catch(() => {})
  fetch(`${API_URL}/api/bag/items`).then(r => r.json()).then(d => setBagItems(d.items || [])).catch(() => {})
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    fetchInitialData()

    let reconnectTimer: ReturnType<typeof setTimeout>

    function connect() {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        useStore.getState().setConnected(true)
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
              fetch(`${API_URL}/api/skills`).then(r => r.json()).then(store.setSkills).catch(() => {})
            }
          } else if (msg.type === 'map') {
            store.setKnowledgeMap(msg.data)
          } else if (msg.type === 'quest') {
            fetch(`${API_URL}/api/quest/active`).then(r => r.json()).then(d => store.setQuests(d.quests || [])).catch(() => {})
          } else if (msg.type === 'bag') {
            fetch(`${API_URL}/api/bag/items`).then(r => r.json()).then(d => store.setBagItems(d.items || [])).catch(() => {})
          }
        } catch {}
      }

      ws.onclose = () => {
        useStore.getState().setConnected(false)
        reconnectTimer = setTimeout(connect, 3000)
      }

      ws.onerror = () => ws.close()
    }

    connect()
    return () => {
      clearTimeout(reconnectTimer)
      wsRef.current?.close()
    }
  }, [])
}

export { API_URL }
