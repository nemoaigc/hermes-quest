import { useState, useEffect } from 'react'
import { useWebSocket } from './websocket'
import { useStore } from './store'
import TopBar from './panels/TopBar'
import CharacterPanel from './panels/CharacterPanel'
import AdventureLog from './panels/AdventureLog'
import CenterTabs from './panels/CenterTabs'
import SkillPanel from './panels/SkillPanel'
import BagPanel from './panels/BagPanel'
import ReflectionLetter from './components/ReflectionLetter'

// Pre-load all background images + NPC portraits
// Only preload the default tab (MAP) background — others load on demand
const PRELOAD_IMAGES = [
  '/bg/map-bg.png',
]

function preloadImages(): Promise<void> {
  return new Promise(resolve => {
    let loaded = 0
    const total = PRELOAD_IMAGES.length
    if (total === 0) { resolve(); return }

    PRELOAD_IMAGES.forEach(src => {
      const img = new Image()
      img.onload = img.onerror = () => {
        loaded++
        if (loaded >= total) resolve()
      }
      img.src = src
    })

    // Safety timeout — don't block forever
    setTimeout(resolve, 5000)
  })
}

function LoadingScreen({ progress }: { progress: number }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0d0a06',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-pixel)',
      zIndex: 99999,
    }}>
      <div style={{ fontSize: '14px', letterSpacing: '4px', color: '#f0e68c', marginBottom: '6px' }}>
        HERMES QUEST
      </div>
      <div style={{ fontSize: '6px', color: '#8b7355', marginBottom: '24px', letterSpacing: '2px' }}>
        AI Self-Evolution RPG
      </div>
      <div style={{
        width: '160px', height: '8px',
        background: '#1a140c',
        border: '2px solid #3a2210',
        boxShadow: 'inset 0 1px 0 #0d0a06',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #5c3a1e, #f0e68c)',
          transition: 'width 0.3s',
        }} />
      </div>
      <div style={{ fontSize: '5px', color: '#5c4a2a', marginTop: '8px' }}>
        {progress < 30 ? 'LOADING ASSETS...' : progress < 70 ? 'PREPARING WORLD...' : 'ENTERING TAVERN...'}
      </div>
    </div>
  )
}

function InventoryWrapper() {
  const count = useStore((s) => s.bagItems.length)
  return (
    <div className="pixel-panel" style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div className="pixel-panel-title" style={{ textAlign: 'center' }}>INVENTORY ({count})</div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <BagPanel />
      </div>
    </div>
  )
}

function ConnectionIndicator() {
  const connected = useStore((s) => s.connected)
  const [showGreen, setShowGreen] = useState(false)

  useEffect(() => {
    if (connected) {
      setShowGreen(true)
      const t = setTimeout(() => setShowGreen(false), 2000)
      return () => clearTimeout(t)
    }
  }, [connected])

  if (!connected) {
    return (
      <div style={{
        position: 'fixed', bottom: '12px', right: '12px', zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'rgba(30,20,10,0.92)',
        border: '1px solid rgba(180,80,40,0.6)',
        borderRadius: '4px',
        padding: '5px 10px',
        fontFamily: 'var(--font-pixel)',
        fontSize: '6px',
        color: '#e8a040',
        animation: 'pulse-reconnect 1.5s ease-in-out infinite',
      }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: '#e8a040',
          animation: 'pulse-reconnect 1.5s ease-in-out infinite',
        }} />
        RECONNECTING...
        <style>{`
          @keyframes pulse-reconnect {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  if (showGreen) {
    return (
      <div style={{
        position: 'fixed', bottom: '12px', right: '12px', zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'rgba(20,30,10,0.85)',
        border: '1px solid rgba(60,140,60,0.5)',
        borderRadius: '4px',
        padding: '5px 10px',
        fontFamily: 'var(--font-pixel)',
        fontSize: '6px',
        color: '#6dbd6d',
        opacity: 0.7,
        transition: 'opacity 0.5s',
      }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: '#6dbd6d',
        }} />
        CONNECTED
      </div>
    )
  }

  return null
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const state = useStore((s) => s.state)

  useWebSocket()

  useEffect(() => {
    let cancelled = false

    async function load() {
      setProgress(20)
      // Preload images + wait for state in parallel, with fast timeout
      const imgPromise = preloadImages()
      const statePromise = new Promise<void>(resolve => {
        const check = () => {
          if (useStore.getState().state) { resolve(); return }
          setTimeout(check, 150)
        }
        check()
        setTimeout(resolve, 1500)
      })
      await Promise.race([
        Promise.all([imgPromise, statePromise]),
        new Promise(r => setTimeout(r, 2000)), // Max 2s total
      ])
      if (cancelled) return
      setProgress(100)
      await new Promise(r => setTimeout(r, 200))
      if (cancelled) return
      setReady(true)
    }

    load()
    return () => { cancelled = true }
  }, [])

  if (!ready) {
    return <LoadingScreen progress={progress} />
  }

  return (
    <>
    <ReflectionLetter />
    <ConnectionIndicator />
    <div style={{
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
      height: '100vh',
      gap: '2px',
      padding: '2px',
    }}>
      <TopBar />
      <div className="dashboard-grid" style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr 280px',
        gap: '2px',
        minHeight: 0,
      }}>
        {/* Left: Character (auto height) + Chronicle (fill rest) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
          <CharacterPanel />
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <AdventureLog />
          </div>
        </div>

        {/* Center */}
        <CenterTabs />

        {/* Right: Skills + Inventory (equal height) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
          <SkillPanel />
          <InventoryWrapper />
        </div>
      </div>
    </div>
    </>
  )
}
