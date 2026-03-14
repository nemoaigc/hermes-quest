import { useState, useRef, useEffect, useCallback } from 'react'
import type { Continent, Connection } from '../types'

type AnyContinent = Continent & { sub_regions?: any[]; sub_nodes?: any[]; skills_involved?: string[] }

interface Props {
  continent: AnyContinent
  connections: Connection[]
  onBack: () => void
}

interface Node {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  region: string
  regionColor: string
}

const REGION_COLORS = ['#4ecdc4', '#a855f7', '#f0e68c', '#ff6b6b', '#ff9944', '#66bb6a', '#42a5f5']

export default function SubRegionGraph({ continent, connections, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 400, h: 200 })
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const nodesRef = useRef<Node[]>([])
  const animRef = useRef<number>(0)
  const mouseRef = useRef({ x: 0, y: 0 })

  const subRegions: any[] = continent.sub_nodes || continent.sub_regions || []
  const allSkills: string[] = continent.skills_involved || subRegions.flatMap((sr: any) => sr.skills || [])

  // Initialize nodes
  useEffect(() => {
    const nodes: Node[] = []
    if (subRegions.length > 0 && subRegions.some((sr: any) => sr.skills?.length > 0)) {
      // v1: skills are inside sub_regions
      subRegions.forEach((sr: any, srIdx: number) => {
        const color = REGION_COLORS[srIdx % REGION_COLORS.length]
        const srSkills: string[] = sr.skills || []
        srSkills.forEach((skill: string) => {
          nodes.push({
            id: skill,
            x: size.w / 2 + (Math.random() - 0.5) * size.w * 0.6,
            y: size.h / 2 + (Math.random() - 0.5) * size.h * 0.6,
            vx: 0, vy: 0,
            region: sr.id || sr.name,
            regionColor: color,
          })
        })
      })
    } else {
      // v2: skills are in skills_involved at workflow level
      allSkills.forEach((skill: string, idx: number) => {
        const srIdx = subRegions.length > 0 ? idx % subRegions.length : 0
        const color = REGION_COLORS[srIdx % REGION_COLORS.length]
        nodes.push({
          id: skill,
          x: size.w / 2 + (Math.random() - 0.5) * size.w * 0.6,
          y: size.h / 2 + (Math.random() - 0.5) * size.h * 0.6,
          vx: 0, vy: 0,
          region: subRegions[srIdx]?.name || continent.name,
          regionColor: color,
        })
      })
    }
    nodesRef.current = nodes
  }, [continent.id, size.w, size.h, allSkills.length, subRegions.length])

  // Resize
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setSize({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight })
      }
    }
    updateSize()
    const ro = new ResizeObserver(updateSize)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Force simulation + render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const nodes = nodesRef.current
    const W = size.w, H = size.h

    // Physics
    const localConns = connections.filter(c => allSkills.includes(c.from) && allSkills.includes(c.to))

    for (const node of nodes) {
      // Center gravity
      node.vx += (W / 2 - node.x) * 0.001
      node.vy += (H / 2 - node.y) * 0.001

      // Repulsion from other nodes
      for (const other of nodes) {
        if (node === other) continue
        const dx = node.x - other.x
        const dy = node.y - other.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        if (dist < 80) {
          const force = (80 - dist) * 0.02
          node.vx += (dx / dist) * force
          node.vy += (dy / dist) * force
        }
      }

      // Attraction along connections
      for (const conn of localConns) {
        let other: Node | undefined
        if (conn.from === node.id) other = nodes.find(n => n.id === conn.to)
        else if (conn.to === node.id) other = nodes.find(n => n.id === conn.from)
        if (!other) continue
        const dx = other.x - node.x
        const dy = other.y - node.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        if (dist > 40) {
          node.vx += dx * 0.003
          node.vy += dy * 0.003
        }
      }

      // Gentle mouse influence — don't push away hard
      const mdx = node.x - mouseRef.current.x
      const mdy = node.y - mouseRef.current.y
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy) || 1
      if (mdist < 30) {
        node.vx += (mdx / mdist) * 0.1
        node.vy += (mdy / mdist) * 0.1
      }

      // Strong damping — nodes settle quickly, barely drift
      node.vx *= 0.85
      node.vy *= 0.85
      // Very subtle breathing — not flying around
      node.vx += Math.sin(Date.now() * 0.0005 + node.x * 0.02) * 0.008
      node.vy += Math.cos(Date.now() * 0.0006 + node.y * 0.02) * 0.008

      // Apply velocity
      node.x += node.vx
      node.y += node.vy

      // Bounds
      node.x = Math.max(20, Math.min(W - 20, node.x))
      node.y = Math.max(15, Math.min(H - 15, node.y))
    }

    // Starfield background
    ctx.fillStyle = '#080610'
    ctx.fillRect(0, 0, W, H)

    // Stars — seeded from size so they don't flicker
    for (let i = 0; i < 80; i++) {
      const sx = ((i * 7919 + 13) % W)
      const sy = ((i * 6271 + 37) % H)
      const brightness = 0.2 + (Math.sin(t * 0.5 + i * 1.3) * 0.15)
      const sr = ((i * 3) % 3 === 0) ? 1.2 : 0.6
      ctx.beginPath()
      ctx.arc(sx, sy, sr, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(200,190,255,${brightness})`
      ctx.fill()
    }

    // Nebula haze
    const nebula = ctx.createRadialGradient(W * 0.3, H * 0.4, 0, W * 0.3, H * 0.4, W * 0.4)
    nebula.addColorStop(0, 'rgba(60,20,80,0.08)')
    nebula.addColorStop(0.5, 'rgba(20,10,60,0.05)')
    nebula.addColorStop(1, 'transparent')
    ctx.fillStyle = nebula
    ctx.fillRect(0, 0, W, H)

    const nebula2 = ctx.createRadialGradient(W * 0.7, H * 0.6, 0, W * 0.7, H * 0.6, W * 0.3)
    nebula2.addColorStop(0, 'rgba(20,40,80,0.06)')
    nebula2.addColorStop(1, 'transparent')
    ctx.fillStyle = nebula2
    ctx.fillRect(0, 0, W, H)

    const t = Date.now() * 0.001 // time for animations

    // Draw magic energy connections
    for (const conn of localConns) {
      const from = nodes.find(n => n.id === conn.from)
      const to = nodes.find(n => n.id === conn.to)
      if (!from || !to) continue

      const isHighlighted = hoveredNode === conn.from || hoveredNode === conn.to

      // Magic energy line
      ctx.beginPath()
      const mx = (from.x + to.x) / 2
      const my = (from.y + to.y) / 2 - 8
      ctx.moveTo(from.x, from.y)
      ctx.quadraticCurveTo(mx, my, to.x, to.y)

      if (isHighlighted) {
        // Glowing magic line
        ctx.strokeStyle = 'rgba(240,230,140,0.5)'
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.strokeStyle = 'rgba(240,230,140,0.9)'
        ctx.lineWidth = 1
        ctx.stroke()
      } else {
        ctx.strokeStyle = 'rgba(139,94,60,0.2)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Traveling particle along connection
      if (isHighlighted) {
        const progress = (t * 0.5 + from.x * 0.01) % 1
        const px = from.x + (to.x - from.x) * progress
        const py = from.y + (to.y - from.y) * progress - Math.sin(progress * Math.PI) * 8
        const pg = ctx.createRadialGradient(px, py, 0, px, py, 3)
        pg.addColorStop(0, 'rgba(240,230,140,0.8)')
        pg.addColorStop(1, 'transparent')
        ctx.fillStyle = pg
        ctx.beginPath()
        ctx.arc(px, py, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw nodes as magic orbs
    for (const node of nodes) {
      const isHovered = hoveredNode === node.id
      const isConnected = hoveredNode && localConns.some(c =>
        (c.from === hoveredNode && c.to === node.id) || (c.to === hoveredNode && c.from === node.id)
      )
      const pulse = Math.sin(t * 2 + node.x * 0.1) * 0.15 + 1 // gentle pulse 0.85-1.15

      // Outer magic glow — always visible, pulsing
      const glowR = (isHovered ? 20 : 12) * pulse
      const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR)
      glow.addColorStop(0, node.regionColor + (isHovered ? '50' : '20'))
      glow.addColorStop(0.6, node.regionColor + '10')
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2)
      ctx.fill()

      // Core orb
      const r = isHovered ? 6 : 4
      const gradient = ctx.createRadialGradient(node.x - 1, node.y - 1, 0, node.x, node.y, r)
      gradient.addColorStop(0, '#ffffff')
      gradient.addColorStop(0.3, node.regionColor)
      gradient.addColorStop(1, node.regionColor + '60')
      ctx.beginPath()
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      // Sparkle highlight
      ctx.beginPath()
      ctx.arc(node.x - r * 0.3, node.y - r * 0.3, r * 0.25, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.fill()

      // Ring for hovered
      if (isHovered) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, r + 3, 0, Math.PI * 2)
        ctx.strokeStyle = '#f0e68c'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Label — always show for hovered, connected shows dimmer
      if (isHovered || isConnected) {
        ctx.font = isHovered ? '7px "Press Start 2P", monospace' : '5px "Press Start 2P", monospace'
        ctx.fillStyle = isHovered ? '#f0e68c' : '#c8a87a'
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 3
        ctx.fillText(node.id.replace(/-/g, ' '), node.x, node.y + r + 12)
        ctx.shadowBlur = 0
      }
    }

    animRef.current = requestAnimationFrame(render)
  }, [size, connections, allSkills, hoveredNode])

  useEffect(() => {
    animRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animRef.current)
  }, [render])

  // Mouse tracking for hover
  function handleMouseMove(e: React.MouseEvent) {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    mouseRef.current = { x, y }

    let closest: string | null = null
    let minDist = 20
    for (const node of nodesRef.current) {
      const dx = node.x - x, dy = node.y - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < minDist) { minDist = dist; closest = node.id }
    }
    setHoveredNode(closest)
  }

  return (
    <div ref={containerRef} style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      cursor: hoveredNode ? 'pointer' : 'default',
    }}>
      <canvas
        ref={canvasRef}
        width={size.w}
        height={size.h}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHoveredNode(null); mouseRef.current = { x: -100, y: -100 } }}
        style={{ width: '100%', height: '100%' }}
      />
      {/* Title + back */}
      <div style={{
        position: 'absolute', top: 4, left: 6,
        fontFamily: 'var(--font-pixel)', fontSize: '6px', color: '#f0e68c',
        display: 'flex', alignItems: 'center', gap: '6px',
        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
      }}>
        <span onClick={onBack} style={{ cursor: 'pointer', color: '#8b7355' }}>◀</span>
        <span>{continent.name}</span>
        <span style={{ color: '#8b7355', fontSize: '5px' }}>{continent.description}</span>
      </div>
    </div>
  )
}
