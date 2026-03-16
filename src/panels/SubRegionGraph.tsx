import { useState, useRef, useEffect } from 'react'
import type { Continent, SubNode, Connection } from '../types'

type AnyContinent = Continent & { sub_regions?: SubNode[]; sub_nodes?: SubNode[]; skills_involved?: string[] }

interface Props {
  continent: AnyContinent
  connections: Connection[]
  onBack: () => void
  extraAction?: React.ReactNode
}

const COLORS = [
  '#4ecdc4', '#a855f7', '#f0e68c', '#ff6b6b', '#ff9944', '#66bb6a', '#42a5f5',
  '#e879f9', '#38bdf8', '#fb923c', '#34d399', '#f472b6', '#facc15', '#a78bfa',
  '#2dd4bf', '#f87171',
]

interface Node {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  color: string
}

export default function SubRegionGraph({ continent, connections, onBack, extraAction }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<Node[]>([])
  const sizeRef = useRef({ w: 400, h: 200 })
  const hoveredRef = useRef<string | null>(null)
  const mouseRef = useRef({ x: -100, y: -100 })
  const animRef = useRef<number>(0)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const subRegions: SubNode[] = continent.sub_nodes || continent.sub_regions || []
  const allSkills: string[] = [...new Set(continent.skills_involved || subRegions.flatMap((sr) => sr.name ? [sr.name] : []))]
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
            if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
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
      const hash = skill.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      const srIdx = hash
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

      // Physics — symmetric forces
      for (const node of nodes) {
        node.vx += (W / 2 - node.x) * 0.001
        node.vy += (H / 2 - node.y) * 0.001
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          if (dist < 60) {
            const f = (60 - dist) * 0.008
            const fx = (dx / dist) * f, fy = (dy / dist) * f
            a.vx += fx; a.vy += fy
            b.vx -= fx; b.vy -= fy
          }
          if (a.color === b.color && dist > 30 && dist < 150) {
            const fx = dx * 0.0005, fy = dy * 0.0005
            a.vx -= fx; a.vy -= fy
            b.vx += fx; b.vy += fy
          }
        }
      }
      for (const node of nodes) {
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

      // Stars — subtle twinkling
      for (let i = 0; i < 80; i++) {
        const sx = (i * 7919 + 13) % W
        const sy = (i * 6271 + 37) % H
        const twinkle = 0.15 + Math.sin(t * 0.6 + i * 2.1) * 0.15
        const size = i % 5 === 0 ? 2.5 : i % 3 === 0 ? 1.5 : 0.8

        ctx.fillStyle = `rgba(200,195,240,${twinkle})`
        if (size > 2) {
          ctx.fillRect(sx - 0.5, sy - size, 1, size * 2)
          ctx.fillRect(sx - size, sy - 0.5, size * 2, 1)
          ctx.globalAlpha = twinkle * 0.5
          ctx.fillRect(sx - size * 0.5, sy - size * 0.5, 1, 1)
          ctx.fillRect(sx + size * 0.5, sy - size * 0.5, 1, 1)
          ctx.fillRect(sx - size * 0.5, sy + size * 0.5, 1, 1)
          ctx.fillRect(sx + size * 0.5, sy + size * 0.5, 1, 1)
          ctx.globalAlpha = 1
        } else if (size > 1) {
          ctx.fillRect(sx, sy - 1, 1, 3)
          ctx.fillRect(sx - 1, sy, 3, 1)
        } else {
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

      // Skill nodes — varied star shapes
      for (const node of nodes) {
        const isH = hovered === node.id
        const pulse = Math.sin(t * 1.5 + node.x * 0.08) * 0.1 + 1
        const r = (isH ? 7 : 4) * pulse
        const x = node.x, y = node.y
        const hash = node.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
        const shape = hash % 5

        // Soft glow
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5)
        g.addColorStop(0, node.color + (isH ? '30' : '0c'))
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, r * 2.5, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = node.color
        ctx.globalAlpha = isH ? 1 : 0.85

        if (shape === 0) {
          // ✦ 4-pointed star — cross with center dot
          ctx.fillRect(x - 0.7, y - r, 1.4, r * 2)
          ctx.fillRect(x - r, y - 0.7, r * 2, 1.4)
          ctx.fillStyle = '#fff'
          ctx.fillRect(x - 1, y - 1, 2, 2)
        } else if (shape === 1) {
          // ✶ 6-pointed — two overlapping triangles
          ctx.beginPath()
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2
            const rr = i % 2 === 0 ? r : r * 0.45
            const px = x + Math.cos(a) * rr
            const py = y + Math.sin(a) * rr
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
          }
          ctx.closePath()
          ctx.fill()
          ctx.fillStyle = '#fff'
          ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6)
        } else if (shape === 2) {
          // ◆ Diamond
          ctx.beginPath()
          ctx.moveTo(x, y - r)
          ctx.lineTo(x + r * 0.6, y)
          ctx.lineTo(x, y + r)
          ctx.lineTo(x - r * 0.6, y)
          ctx.closePath()
          ctx.fill()
          ctx.fillStyle = '#fff'
          ctx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4)
        } else if (shape === 3) {
          // ✴ 8-pointed — cross + diagonal
          ctx.fillRect(x - 0.6, y - r, 1.2, r * 2)
          ctx.fillRect(x - r, y - 0.6, r * 2, 1.2)
          const d = r * 0.65
          ctx.fillRect(x - d, y - d, 1.2, 1.2)
          ctx.fillRect(x + d - 1, y - d, 1.2, 1.2)
          ctx.fillRect(x - d, y + d - 1, 1.2, 1.2)
          ctx.fillRect(x + d - 1, y + d - 1, 1.2, 1.2)
          // Connect diagonals
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(Math.PI / 4)
          ctx.fillStyle = node.color
          ctx.fillRect(-0.5, -r * 0.7, 1, r * 1.4)
          ctx.fillRect(-r * 0.7, -0.5, r * 1.4, 1)
          ctx.restore()
          ctx.fillStyle = '#fff'
          ctx.fillRect(x - 1, y - 1, 2, 2)
        } else {
          // ★ 5-pointed star
          ctx.beginPath()
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2 - Math.PI / 2
            const rr = i % 2 === 0 ? r : r * 0.4
            const px = x + Math.cos(a) * rr
            const py = y + Math.sin(a) * rr
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
          }
          ctx.closePath()
          ctx.fill()
          ctx.fillStyle = '#fff'
          ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6)
        }

        ctx.globalAlpha = 1

        // Hover ring
        if (isH) {
          ctx.beginPath()
          ctx.arc(x, y, r + 4, 0, Math.PI * 2)
          ctx.strokeStyle = '#f0e68c60'
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Label
        if (isH) {
          ctx.font = '8px "Press Start 2P", monospace'
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
    <div style={{
      width: '100%', height: '100%', minHeight: '80px',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Title bar — fixed, same font size as other panels */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '4px 8px',
        background: 'rgba(10,8,4,0.6)',
        borderBottom: '1px solid rgba(107,76,42,0.3)',
        flexShrink: 0,
      }}>
        <span onClick={onBack} style={{
          cursor: 'pointer', color: '#8b7355',
          fontFamily: 'var(--font-pixel)', fontSize: '6px',
        }}>◀</span>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: '#f0e68c' }}>
          {continent.name}
        </span>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: '#8b7355', flex: 1 }}>
          {continent.description}
        </span>
        {extraAction}
      </div>
      {/* Canvas — fills remaining space */}
      <div ref={containerRef} style={{
        flex: 1, position: 'relative', overflow: 'hidden',
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
      </div>
    </div>
  )
}
