import type { ReactElement } from 'react'
import { getSkillIconPath, getItemIconPath } from './icon-registry'
/* Pixel art SVG icons — no emojis, unified dark fantasy style */

const S = 16 // viewBox size

function px(paths: Array<[number, number, number, number, string]>) {
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${S} ${S}`} style={{ imageRendering: 'pixelated' }}>
      {paths.map(([x, y, w, h, fill], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
      ))}
    </svg>
  )
}

/* ── Class icons (character panel) ── */
// Classes map to real AI capability profiles:
// artificer = coding-focused, scholar = research-focused,
// automancer = automation-focused, polymath = balanced, hivemind = delegation-heavy
export function ClassIcon({ cls, size = 32 }: { cls: string; size?: number }) {
  const wrap = (inner: ReactElement) => <div style={{ width: size, height: size }}>{inner}</div>

  switch (cls) {
    // Legacy names → redirect to new names
    case 'warrior': case 'artificer': return wrap(px([
      [4,2,3,3,'#4FC3F7'],[9,2,3,3,'#4FC3F7'], // code brackets < >
      [6,5,4,2,'#81C784'], // circuit board center
      [3,8,10,1,'#546E7A'], // workbench
      [5,9,2,5,'#8D6E63'],[9,9,2,5,'#8D6E63'], // table legs
      [4,10,8,2,'#78909C'], // tools on bench
      [6,11,1,1,'#FFD54F'],[9,11,1,1,'#FFD54F'], // sparks
    ]))
    case 'mage': case 'scholar': return wrap(px([
      [3,2,10,12,'#5D4037'],[4,3,8,10,'#8D6E63'], // book cover
      [5,4,6,1,'#FFF8E1'],[5,6,6,1,'#FFF8E1'],[5,8,4,1,'#FFF8E1'], // text lines
      [3,1,2,1,'#CE93D8'],[11,1,2,1,'#CE93D8'], // bookmark tabs
      [6,10,4,2,'#AB47BC'], // knowledge glow
      [7,0,2,2,'#E1BEE7'], // insight spark
    ]))
    case 'ranger': case 'automancer': return wrap(px([
      [5,2,6,6,'#78909C'],[6,3,4,4,'#B0BEC5'], // gear outer
      [7,4,2,2,'#455A64'], // gear center
      [4,5,1,2,'#78909C'],[11,5,1,2,'#78909C'], // gear teeth
      [6,1,1,1,'#78909C'],[9,1,1,1,'#78909C'],
      [3,10,4,4,'#546E7A'],[9,10,4,4,'#546E7A'], // linked gears
      [5,11,2,2,'#78909C'],[10,11,2,2,'#78909C'],
      [7,9,2,1,'#FFD54F'], // lightning bolt
    ]))
    case 'paladin': case 'polymath': return wrap(px([
      [6,1,4,4,'#FFD54F'],[5,2,1,2,'#FFC107'],[10,2,1,2,'#FFC107'], // diamond/gem
      [7,5,2,2,'#E1BEE7'], // core
      [3,8,4,3,'#4FC3F7'],[9,8,4,3,'#81C784'], // dual domains
      [6,8,4,3,'#FFD54F'], // bridge
      [4,12,8,3,'#546E7A'], // foundation
    ]))
    case 'necromancer': case 'hivemind': return wrap(px([
      [7,1,2,3,'#CE93D8'], // central node
      [3,5,3,3,'#4FC3F7'],[10,5,3,3,'#81C784'], // child nodes
      [3,11,3,3,'#FFD54F'],[10,11,3,3,'#EF5350'], // child nodes
      [6,3,1,1,'#9575CD'],[9,3,1,1,'#9575CD'], // links up
      [6,7,1,1,'#9575CD'],[9,7,1,1,'#9575CD'], // links mid
      [6,12,1,1,'#9575CD'],[9,12,1,1,'#9575CD'], // links down
    ]))
    default: return wrap(px([[4,4,8,8,'#666']]))
  }
}

/* ── Category icons (skill inventory) ── */
export function CategoryIcon({ cat, size = 18 }: { cat: string; size?: number }) {
  const wrap = (inner: ReactElement) => <div style={{ width: size, height: size }}>{inner}</div>

  switch (cat) {
    case 'coding': return wrap(px([
      [2,4,3,1,'#4FC3F7'],[4,5,2,1,'#4FC3F7'],[6,6,2,1,'#4FC3F7'], // < bracket
      [8,8,2,1,'#4FC3F7'],[10,9,2,1,'#4FC3F7'],[12,10,3,1,'#4FC3F7'], // > bracket
      [7,3,2,10,'#81C784'], // slash
    ]))
    case 'research': return wrap(px([
      [3,2,10,12,'#8D6E63'],[4,3,8,10,'#FFF8E1'], // book
      [5,5,6,1,'#455A64'],[5,7,6,1,'#455A64'],[5,9,4,1,'#455A64'], // text lines
    ]))
    case 'automation': return wrap(px([
      [5,2,6,6,'#78909C'],[6,3,4,4,'#B0BEC5'], // gear outer
      [7,4,2,2,'#455A64'], // gear center
      [4,5,1,2,'#78909C'],[11,5,1,2,'#78909C'], // gear teeth
      [6,1,1,1,'#78909C'],[9,1,1,1,'#78909C'],
      [6,8,1,1,'#78909C'],[9,8,1,1,'#78909C'],
      [5,10,6,4,'#546E7A'],[6,11,4,2,'#78909C'], // base
    ]))
    default: return wrap(px([
      [6,2,4,4,'#FFD54F'],[5,3,1,2,'#FFC107'],[10,3,1,2,'#FFC107'], // diamond/gem
      [7,6,2,4,'#FFC107'],[6,6,4,1,'#FFD54F'],
    ]))
  }
}

/* ── Item icons (inventory, shop) ── */
export function ItemIcon({ item, size = 20 }: { item: string; size?: number }) {
  // Try real pixel art icon first
  const iconPath = getItemIconPath(item)
  if (iconPath) {
    return (
      <div style={{ width: size, height: size }}>
        <img
          src={iconPath}
          alt={item}
          width={size}
          height={size}
          style={{ imageRendering: 'pixelated', borderRadius: '2px' }}
        />
      </div>
    )
  }

  const wrap = (inner: ReactElement) => <div style={{ width: size, height: size }}>{inner}</div>

  switch (item) {
    case 'red_potion': return wrap(px([
      [6,1,4,2,'#795548'],[5,3,6,2,'#8D6E63'], // cork + neck
      [4,5,8,8,'#E53935'],[5,6,6,6,'#EF5350'], // bottle body
      [6,7,2,2,'#FFCDD2'], // highlight
      [4,13,8,2,'#C62828'], // bottom
    ]))
    case 'blue_potion': return wrap(px([
      [6,1,4,2,'#795548'],[5,3,6,2,'#8D6E63'],
      [4,5,8,8,'#1565C0'],[5,6,6,6,'#1E88E5'],
      [6,7,2,2,'#BBDEFB'],
      [4,13,8,2,'#0D47A1'],
    ]))
    case 'xp_scroll': return wrap(px([
      [3,2,10,12,'#FFF8E1'],[3,2,10,2,'#D7CCC8'],[3,12,10,2,'#D7CCC8'], // scroll
      [5,5,6,1,'#455A64'],[5,7,6,1,'#455A64'],[5,9,4,1,'#455A64'], // text
      [2,1,2,3,'#BCAAA4'],[12,1,2,3,'#BCAAA4'], // rolls
      [2,12,2,3,'#BCAAA4'],[12,12,2,3,'#BCAAA4'],
    ]))
    case 'teleport_scroll': return wrap(px([
      [6,2,4,4,'#7E57C2'],[5,3,1,2,'#9575CD'],[10,3,1,2,'#9575CD'], // portal
      [7,1,2,1,'#B39DDB'],[7,6,2,1,'#B39DDB'], // glow
      [4,8,8,6,'#FFF8E1'],[5,9,6,1,'#455A64'],[5,11,4,1,'#455A64'], // scroll
    ]))
    case 'revival_elixir': return wrap(px([
      [6,1,4,2,'#FFD54F'],[5,3,6,2,'#FFC107'],
      [4,5,8,8,'#FFD54F'],[5,6,6,6,'#FFECB3'],
      [7,7,2,4,'#FF6F00'], // cross
      [6,9,4,2,'#FF6F00'],
      [4,13,8,2,'#F9A825'],
    ]))
    default: return wrap(px([[4,4,8,8,'#666']]))
  }
}

/* ── Procedural skill identicon (unique per skill name + category) ── */

// Deterministic hash → 32 bits from string
function hashStr(s: string): number {
  let a = 0x9e3779b9, b = 0x9e3779b9, c = 0
  for (let i = 0; i < s.length; i++) {
    c = (c + s.charCodeAt(i)) | 0
    a = (a ^ c) | 0; a = (a - (c << 11)) | 0
    b = (b ^ a) | 0; b = (b - (a << 25)) | 0
    c = (c ^ b) | 0; c = (c - (b << 5)) | 0
  }
  return Math.abs((a ^ b ^ c) | 0)
}

// Seeded PRNG (mulberry32)
function rng(seed: number) {
  let t = seed + 0x6d2b79f5
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Category → hue range + accent hue (degrees)
const CAT_HUE: Record<string, [number, number, number]> = {
  // [base hue, hue range, accent hue offset]
  coding:                 [200, 30, 120],   // blue
  'software-development': [210, 25, 130],   // blue-ish
  research:               [280, 30, -80],   // purple
  automation:             [200, 10, 40],     // steel
  creative:               [40, 30, 160],     // gold/amber
  media:                  [0, 30, 180],      // red
  gaming:                 [130, 30, -60],    // green
  mlops:                  [265, 35, 90],     // violet
  leisure:                [180, 25, -80],    // teal
  dogfood:                [15, 20, 150],     // orange
  quest:                  [45, 25, 100],     // warm gold
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${((h % 360) + 360) % 360},${Math.round(s)}%,${Math.round(l)}%)`
}

/*
 * Generates a 5x5 vertically-symmetric pixel identicon on a 16x16 viewBox.
 * Each skill name produces a completely unique pattern.
 * Category determines the color family.
 */
export function SkillIcon({ name, category, size = 18 }: { name: string; category: string; size?: number }) {
  // Try real pixel art icon first
  const iconPath = getSkillIconPath(name, category)
  if (iconPath) {
    return (
      <div style={{ width: size, height: size }}>
        <img
          src={iconPath}
          alt={name}
          width={size}
          height={size}
          style={{ imageRendering: 'pixelated', borderRadius: '2px' }}
        />
      </div>
    )
  }

  // Fallback to procedural identicon
  const seed = hashStr(name || 'x')
  const r = rng(seed)

  const [baseHue, hueRange, accentOff] = CAT_HUE[category] || [45, 25, 100]

  // Derive 3 unique colors from the hash
  const h1 = baseHue + (r() - 0.5) * hueRange * 2
  const h2 = h1 + accentOff * (0.3 + r() * 0.7)
  const bg  = hsl(h1, 15 + r() * 10, 10 + r() * 5)        // dark background
  const fg1 = hsl(h1, 55 + r() * 30, 45 + r() * 20)       // primary color
  const fg2 = hsl(h2, 50 + r() * 30, 50 + r() * 20)       // accent color
  const hi  = hsl(h1, 30 + r() * 20, 70 + r() * 15)       // highlight

  // Generate a 5x7 grid (left half + center column); mirror for symmetry
  // Each cell is 2x2 pixels, placed in the center 10x14 area (offset 3,1)
  const COLS = 5
  const ROWS = 7
  const grid: number[][] = []
  for (let row = 0; row < ROWS; row++) {
    grid[row] = []
    for (let col = 0; col < 3; col++) { // only generate left half + center
      // Bias toward empty at edges, filled in center
      const distFromCenter = Math.abs(col - 2) / 2 + Math.abs(row - 3) / 3
      const fillChance = 0.6 - distFromCenter * 0.25
      grid[row][col] = r() < fillChance ? (r() < 0.35 ? 2 : 1) : 0
    }
    // Mirror: col 3 = col 1, col 4 = col 0
    grid[row][3] = grid[row][1]
    grid[row][4] = grid[row][0]
  }

  // Ensure at least some pixels are filled (minimum visual mass)
  let filled = 0
  for (let row = 0; row < ROWS; row++)
    for (let col = 0; col < COLS; col++)
      if (grid[row][col]) filled++
  if (filled < 8) {
    // Force a cross-like pattern in center
    grid[2][2] = 1; grid[3][1] = 1; grid[3][2] = 2; grid[3][3] = 1; grid[4][2] = 1
  }

  const cellW = 2
  const cellH = 2
  const offX = 3 // center the 10-wide pattern in 16
  const offY = 1 // center the 14-tall pattern in 16

  const rects: Array<[number, number, number, number, string]> = []

  // Background shape (rounded-ish border)
  rects.push([1, 0, 14, 16, bg])
  rects.push([0, 1, 16, 14, bg])

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const v = grid[row][col]
      if (v === 0) continue
      const x = offX + col * cellW
      const y = offY + row * cellH
      const color = v === 1 ? fg1 : fg2
      rects.push([x, y, cellW, cellH, color])
    }
  }

  // Add a subtle highlight pixel in top-left of a random filled cell
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < 3; col++) {
      if (grid[row][col] && r() < 0.3) {
        rects.push([offX + col * cellW, offY + row * cellH, 1, 1, hi])
        // Mirror highlight
        const mCol = COLS - 1 - col
        rects.push([offX + mCol * cellW + 1, offY + row * cellH, 1, 1, hi])
      }
    }
  }

  return (
    <div style={{ width: size, height: size }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${S} ${S}`} style={{ imageRendering: 'pixelated' }}>
        {rects.map(([x, y, w, h, fill], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
        ))}
      </svg>
    </div>
  )
}

/* ── Event log icons ── */
export const EVENT_ICONS: Record<string, ReactElement> = {
  cycle_start: px([[4,4,8,2,'#4DD0E1'],[4,6,2,4,'#4DD0E1'],[8,6,4,2,'#4DD0E1'],[8,8,2,4,'#4DD0E1'],[4,10,4,2,'#4DD0E1']]), // cycle arrows
  reflect: px([[5,2,6,6,'#CE93D8'],[6,3,4,4,'#E1BEE7'],[7,4,2,2,'#CE93D8'],[8,8,1,4,'#CE93D8'],[7,12,3,3,'#CE93D8']]), // magnifying glass
  train_start: px([[7,1,2,3,'#B0BEC5'],[6,4,4,2,'#90A4AE'],[7,6,2,6,'#78909C'],[5,7,1,1,'#8D6E63'],[10,7,1,1,'#8D6E63']]), // sword
  train_fail: px([[3,3,3,3,'#EF5350'],[10,3,3,3,'#EF5350'],[6,6,4,4,'#EF5350'],[3,10,3,3,'#EF5350'],[10,10,3,3,'#EF5350']]), // X
  skill_drop: px([[7,1,2,2,'#FFD54F'],[5,3,6,2,'#FFC107'],[3,5,10,2,'#FFD54F'],[5,7,6,2,'#FFC107'],[7,9,2,2,'#FFD54F'],[7,11,2,4,'#FFC107']]), // star
  xp_gain: px([[7,1,2,2,'#66BB6A'],[5,3,6,2,'#4CAF50'],[3,5,10,2,'#66BB6A'],[5,7,6,2,'#4CAF50'],[7,9,2,2,'#66BB6A']]), // green star
  level_up: px([[6,2,4,2,'#FFD54F'],[5,4,6,2,'#FFC107'],[4,6,8,2,'#FFD54F'],[3,8,10,2,'#FFC107'],[5,10,6,2,'#FFD54F'],[7,12,2,2,'#FFC107']]), // arrow up
  boss_fight: px([[4,2,8,6,'#EF5350'],[3,4,2,3,'#C62828'],[11,4,2,3,'#C62828'],[5,3,2,2,'#FFEB3B'],[9,3,2,2,'#FFEB3B'],[6,8,4,4,'#EF5350'],[5,12,6,3,'#C62828']]), // dragon head
  region_unlock: px([[3,2,10,10,'#8D6E63'],[4,3,8,8,'#D7CCC8'],[6,5,2,2,'#4CAF50'],[8,5,2,2,'#4CAF50'],[5,8,6,1,'#78909C']]), // map
  region_move: px([[3,6,4,4,'#78909C'],[7,5,2,1,'#B0BEC5'],[9,4,2,1,'#B0BEC5'],[11,3,2,2,'#FFD54F']]), // arrow right
  quest_accept: px([[3,2,10,12,'#FFF8E1'],[4,4,7,1,'#455A64'],[4,6,7,1,'#455A64'],[4,8,5,1,'#455A64'],[4,10,6,1,'#455A64']]), // scroll
  quest_complete: px([[3,6,2,2,'#4CAF50'],[5,8,2,2,'#4CAF50'],[7,6,2,2,'#4CAF50'],[9,4,2,2,'#4CAF50'],[11,2,2,2,'#4CAF50']]), // checkmark
  quest_fail: px([[3,3,2,2,'#EF5350'],[5,5,2,2,'#EF5350'],[7,7,2,2,'#EF5350'],[9,5,2,2,'#EF5350'],[11,3,2,2,'#EF5350'],[9,9,2,2,'#EF5350'],[11,11,2,2,'#EF5350'],[3,9,2,2,'#EF5350'],[5,11,2,2,'#EF5350']]), // X mark
  class_shift: px([[3,4,4,4,'#CE93D8'],[7,3,2,1,'#B0BEC5'],[7,8,2,1,'#B0BEC5'],[9,4,4,4,'#4FC3F7']]), // transform
  item_use: px([[6,1,4,2,'#795548'],[5,3,6,2,'#8D6E63'],[4,5,8,8,'#4CAF50'],[5,6,6,6,'#66BB6A'],[4,13,8,2,'#388E3C']]), // potion
  hub_browse: px([[3,3,10,10,'#5D4037'],[4,4,8,8,'#8D6E63'],[5,5,3,3,'#FFD54F'],[9,5,2,3,'#4FC3F7'],[5,9,6,2,'#FFF8E1']]), // shop
  hub_acquire: px([[4,2,8,10,'#8D6E63'],[5,3,6,8,'#A1887F'],[6,5,4,4,'#CE93D8'],[4,12,8,3,'#5D4037']]), // chest
  telegram_sent: px([[2,4,12,8,'#42A5F5'],[3,5,10,6,'#64B5F6'],[14,6,1,1,'#1E88E5'],[7,8,3,1,'#BBDEFB']]), // message
  cycle_end: px([[2,12,12,2,'#78909C'],[7,3,2,9,'#78909C'],[4,3,2,2,'#B0BEC5'],[10,3,2,2,'#B0BEC5']]), // flag
  cycle_skip: px([[4,4,8,8,'#546E7A'],[5,5,6,6,'#37474F'],[7,6,2,1,'#78909C'],[6,8,4,1,'#78909C']]), // zzz
}
