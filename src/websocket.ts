import { useEffect, useRef } from 'react'
import { useStore } from './store'

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.host}`

function fetchInitialData() {
  const { setState, setSkills, setRegions, setEvents } = useStore.getState()
  fetch(`${API_URL}/api/state`).then(r => r.json()).then(setState).catch(() => {})
  fetch(`${API_URL}/api/skills`).then(r => r.json()).then(setSkills).catch(() => {})
  fetch(`${API_URL}/api/regions`).then(r => r.json()).then(setRegions).catch(() => {})
  fetch(`${API_URL}/api/events`).then(r => r.json()).then(setEvents).catch(() => {})
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const { setState, addEvent, setConnected, setSkills, setRegions } = useStore()

  useEffect(() => {
    // Always fetch initial data via REST, regardless of WS status
    fetchInitialData()

    let reconnectTimer: ReturnType<typeof setTimeout>

    function connect() {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
      }

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === 'state') {
            setState(msg.data)
          } else if (msg.type === 'event') {
            addEvent(msg.data)
            if (['skill_drop', 'hub_acquire'].includes(msg.data.type)) {
              fetch(`${API_URL}/api/skills`).then(r => r.json()).then(setSkills).catch(() => {})
            }
            if (['region_unlock', 'region_move'].includes(msg.data.type)) {
              fetch(`${API_URL}/api/regions`).then(r => r.json()).then(setRegions).catch(() => {})
            }
          }
        } catch {}
      }

      ws.onclose = () => {
        setConnected(false)
        reconnectTimer = setTimeout(connect, 3000)
      }

      ws.onerror = () => ws.close()
    }

    connect()
    return () => {
      clearTimeout(reconnectTimer)
      wsRef.current?.close()
    }
  }, [setState, addEvent, setConnected, setSkills, setRegions])
}

export { API_URL }
