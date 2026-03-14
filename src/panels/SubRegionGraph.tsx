import { useState, useRef, useEffect } from 'react'
import type { Continent, Connection } from '../types'

type AnyContinent = Continent & { sub_regions?: any[]; sub_nodes?: any[]; skills_involved?: string[] }

interface Props {
  continent: AnyContinent
  connections: Connection[]
  onBack: () => void
}

const COLORS = ['#4ecdc4', '#a855f7', '#f0e68c', '#ff6b6b', '#ff9944', '#66bb6a', '#42a5f5']

interface Node {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  color: string
}

export default function SubRegionGraph({ continent, connections, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<Node[]>([])
  const sizeRef = useRef({ w: 400, h: 200 })
  const hoveredRef = useRef<string | null>(null)
  const mouseRef = useRef({ x: -100, y: -100 })
  const animRef = useRef<number>(0)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const subRegions: any[] = continent.sub_nodes || continent.sub_regions || []
  const allSkills: string[] = continent.skills_involved || subRegions.flatMap((sr: any) => sr.skills || [])
  const allSkillsRef = useRef(allSkills)
  allSkillsRef.current = allSkills

  const connectionsRef = useRef(connections)
  connectionsRef.current = connections

  // Resize observer
  useEffect(() => {
    function update() {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth
        const h = containerRef.current.clientHeight
        if (w > 10 && h > 10) {
          sizeRef.current = { w, h }
          if (canvasRef.current) {
            const dpr = window.devicePixelRatio || 1
            canvasRef.current.width = w * dpr
            canvasRef.current.height = h * dpr
            canvasRef.current.style.width = w + 'px'
            canvasRef.current.style.height = h + 'px'
            const ctx = canvasRef.current.getContext('2d')
            if (ctx) ctx.scale(dpr, dpr)
          }
        }
      }
    }
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Initialize nodes when continent changes
  useEffect(() => {
    const { w, h } = sizeRef.current
    if (w <= 10 || allSkills.length === 0) return
    const nodes: Node[] = allSkills.map((skill, idx) => {
      const srIdx = subRegions.length > 0 ? idx % subRegions.length : 0
      const hash = skill.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      const angle = (idx / allSkills.length) * Math.PI * 2 + (hash % 10) * 0.05
      const radius = Math.min(w, h) * 0.3 + (hash % 15)
      return {
        id: skill,
        x: w / 2 + Math.cos(angle) * radius,
        y: h / 2 + Math.sin(angle) * radius * 0.5,
        vx: 0, vy: 0,
        color: COLORS[srIdx % COLORS.length],
      }
    })
    nodes.forEach(n => {
      n.x = Math.max(20, Math.min(w - 20, n.x))
      n.y = Math.max(20, Math.min(h - 20, n.y))
    })
    nodesRef.current = nodes
  }, [continent.id, allSkills.length])

  // Animation loop — no deps, uses refs only
  useEffect(() => {
    function render() {
      const canvas = canvasRef.current
      if (!canvas) { animRef.current = requestAnimationFrame(render); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { animRef.current = requestAnimationFrame(render); return }

      const nodes = nodesRef.current
      const W = sizeRef.current.w, H = sizeRef.current.h
      const hovered = hoveredRef.current
      const skills = allSkillsRef.current
      const conns = connectionsRef.current
      const t = Date.now() * 0.001

      if (W === 0 || H === 0) { animRef.current = requestAnimationFrame(render); return }

      // Physics
      for (const node of nodes) {
        node.vx += (W / 2 - node.x) * 0.001
        node.vy += (H / 2 - node.y) * 0.001
        for (const other of nodes) {
          if (node === other) continue
          const dx = node.x - other.x, dy = node.y - other.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          if (dist < 60) {
            const f = (60 - dist) * 0.015
            node.vx += (dx / dist) * f
            node.vy += (dy / dist) * f
          }
        }
        // Same-color attraction (constellation grouping)
        for (const other of nodes) {
          if (node === other || node.color !== other.color) continue
          const dx = other.x - node.x, dy = other.y - node.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          if (dist > 30 && dist < 150) {
            node.vx += dx * 0.001
            node.vy += dy * 0.001
          }
        }
        node.vx *= 0.88
        node.vy *= 0.88
        node.vx += Math.sin(t * 0.3 + node.x * 0.02) * 0.01
        node.vy += Math.cos(t * 0.35 + node.y * 0.02) * 0.01
        node.x += node.vx
        node.y += node.vy
        node.x = Math.max(15, Math.min(W - 15, node.x))
        node.y = Math.max(15, Math.min(H - 15, node.y))
      }

      // Background — use full canvas size for clearing, then logical size for drawing
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.fillStyle = '#0a0814'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.restore()

      // Stars — twinkling star shapes
      for (let i = 0; i < 80; i++) {
        const sx = (i * 7919 + 13) % W
        const sy = (i * 6271 + 37) % H
        const twinkle = 0.15 + Math.sin(t * 0.6 + i * 2.1) * 0.15
        const size = i % 5 === 0 ? 2.5 : i % 3 === 0 ? 1.5 : 0.8

        ctx.fillStyle = `rgba(200,195,240,${twinkle})`
        if (size > 2) {
          // Bright star — draw cross shape ✦
          ctx.fillRect(sx - 0.5, sy - size, 1, size * 2)
          ctx.fillRect(sx - size, sy - 0.5, size * 2, 1)
          // Diagonal sparkle
          ctx.globalAlpha = twinkle * 0.5
          ctx.fillRect(sx - size * 0.5, sy - size * 0.5, 1, 1)
          ctx.fillRect(sx + size * 0.5, sy - size * 0.5, 1, 1)
          ctx.fillRect(sx - size * 0.5, sy + size * 0.5, 1, 1)
          ctx.fillRect(sx + size * 0.5, sy + size * 0.5, 1, 1)
          ctx.globalAlpha = 1
        } else if (size > 1) {
          // Medium star — small cross
          ctx.fillRect(sx, sy - 1, 1, 3)
          ctx.fillRect(sx - 1, sy, 3, 1)
        } else {
          // Dim star — single pixel
          ctx.fillRect(sx, sy, 1, 1)
        }
      }

      // Connections — constellation style: connect nodes sharing same color (same sub_region)
      const localConns = conns.filter(c => skills.includes(c.from) && skills.includes(c.to))
      let drawConns = localConns
      if (localConns.length === 0 && nodes.length > 1) {
        // Group by color (= sub_region), connect within groups as constellation lines
        const groups = new Map<string, Node[]>()
        nodes.forEach(n => {
          const g = groups.get(n.color) || []
          g.push(n)
          groups.set(n.color, g)
        })
        const autoConns: { from: string; to: string; strength: number }[] = []
        groups.forEach((group) => {
          for (let i = 0; i < group.length - 1; i++) {
            autoConns.push({ from: group[i].id, to: group[i + 1].id, strength: 0.5 })
          }
        })
        // Also connect the groups to each other (one bridge per group pair)
        const groupKeys = Array.from(groups.keys())
        for (let i = 0; i < groupKeys.length - 1; i++) {
          const g1 = groups.get(groupKeys[i])!
          const g2 = groups.get(groupKeys[i + 1])!
          autoConns.push({ from: g1[g1.length - 1].id, to: g2[0].id, strength: 0.2 })
        }
        drawConns = autoConns
      }

      for (const c of drawConns) {
        const from = nodes.find(n => n.id === c.from)
        const to = nodes.find(n => n.id === c.to)
        if (!from || !to) continue
        const hl = hovered === c.from || hovered === c.to
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2 - 6
        ctx.quadraticCurveTo(mx, my, to.x, to.y)
        if (hl) {
          ctx.strokeStyle = 'rgba(240,230,140,0.5)'
          ctx.lineWidth = 2
          ctx.stroke()
        } else {
          ctx.strokeStyle = 'rgba(100,80,60,0.2)'
          ctx.lineWidth = 1
          ctx.setLineDash([3, 3])
          ctx.stroke()
          ctx.setLineDash([])
        }
      }

      // Nodes
      for (const node of nodes) {
        const isH = hovered === node.id
        const pulse = Math.sin(t * 1.5 + node.x * 0.08) * 0.12 + 1
        const r = (isH ? 7 : 5) * pulse

        // Glow
        const g = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 3)
        g.addColorStop(0, node.color + (isH ? '40' : '18'))
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2)
        ctx.fill()

        // Core
        const cg = ctx.createRadialGradient(node.x - 1, node.y - 1, 0, node.x, node.y, r)
        cg.addColorStop(0, '#fff')
        cg.addColorStop(0.3, node.color)
        cg.addColorStop(1, node.color + '60')
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fillStyle = cg
        ctx.fill()

        // Ring
        if (isH) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, r + 3, 0, Math.PI * 2)
          ctx.strokeStyle = '#f0e68c'
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Label
        if (isH) {
          ctx.font = '6px "Press Start 2P", monospace'
          ctx.fillStyle = '#f0e68c'
          ctx.textAlign = 'center'
          ctx.shadowColor = 'rgba(0,0,0,0.9)'
          ctx.shadowBlur = 4
          ctx.fillText(node.id.replace(/-/g, ' '), node.x, node.y + r + 12)
          ctx.shadowBlur = 0
        }
      }

      animRef.current = requestAnimationFrame(render)
    }

    animRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animRef.current)
  }, []) // NO deps — all data via refs

  function handleMouseMove(e: React.MouseEvent) {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    mouseRef.current = { x, y }
    let closest: string | null = null
    let minDist = 25
    for (const n of nodesRef.current) {
      const d = Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2)
      if (d < minDist) { minDist = d; closest = n.id }
    }
    hoveredRef.current = closest
    setHoveredNode(closest)
  }

  return (
    <div ref={containerRef} style={{
      width: '100%', height: '100%', minHeight: '80px',
      position: 'relative', overflow: 'hidden',
      cursor: hoveredNode ? 'pointer' : 'default',
    }}>
      <canvas
        ref={canvasRef}
        width={sizeRef.current.w}
        height={sizeRef.current.h}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { hoveredRef.current = null; setHoveredNode(null) }}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      <div style={{
        position: 'absolute', top: 4, left: 6,
        fontFamily: 'var(--font-pixel)', fontSize: '6px', color: '#f0e68c',
        display: 'flex', alignItems: 'center', gap: '6px',
        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        pointerEvents: 'auto',
      }}>
        <span onClick={onBack} style={{ cursor: 'pointer', color: '#8b7355' }}>◀</span>
        <span>{continent.name}</span>
        <span style={{ color: '#8b7355', fontSize: '5px' }}>{continent.description}</span>
      </div>
    </div>
  )
}
