/** NPC portraits — PixelLab animated sprite sheets */

import type { NpcId } from '../types'

interface PortraitProps {
  size?: number
  active?: boolean
  speaking?: boolean
}

// Sprite sheet config: each is a horizontal strip of 4 frames, 48x48 per frame
const SPRITE_CONFIG: Record<NpcId, { sheet: string; frames: number; static: string }> = {
  guild_master: { sheet: '/npc/sprites/guild-master-idle.png', frames: 4, static: '/npc/guild-master.png' },
  cartographer: { sheet: '/npc/sprites/cartographer-idle.png', frames: 4, static: '/npc/cartographer.png' },
  quartermaster: { sheet: '/npc/sprites/quartermaster-idle.png', frames: 1, static: '/npc/quartermaster.png' },
  bartender: { sheet: '', frames: 1, static: '/npc/bartender.png' },
  sage: { sheet: '', frames: 1, static: '/npc/sage.png' },
}

// Inject sprite animation keyframes once
const STYLE_ID = 'npc-sprite-anims'
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes npc-sprite-4 {
      0% { background-position-x: 0%; }
      25% { background-position-x: 33.333%; }
      50% { background-position-x: 66.666%; }
      75% { background-position-x: 100%; }
      100% { background-position-x: 0%; }
    }
    @keyframes npc-glow {
      0%, 100% { box-shadow: 0 0 6px 1px rgba(240,230,140,0.3); }
      50% { box-shadow: 0 0 14px 4px rgba(240,230,140,0.7); }
    }
    @keyframes npc-speak-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
  `
  document.head.appendChild(style)
}

function AnimatedPortrait({ npcId, size = 32, active = false, speaking = false }: PortraitProps & { npcId: NpcId }) {
  const config = SPRITE_CONFIG[npcId]
  const hasAnimation = config.frames > 1

  return (
    <div style={{
      width: size, height: size,
      animation: speaking ? 'npc-speak-bounce 0.4s ease-in-out infinite' : 'none',
    }}>
      {hasAnimation ? (
        // Animated sprite sheet
        <div style={{
          width: size,
          height: size,
          backgroundImage: `url(${config.sheet})`,
          backgroundSize: `${config.frames * 100}% 100%`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          animation: `npc-sprite-4 ${speaking ? '0.4s' : '1.2s'} steps(1) infinite`,
          borderRadius: '4px',
          border: active ? '2px solid #f0e68c' : '2px solid transparent',
          boxSizing: 'border-box',
          ...(active ? { animation: `npc-sprite-4 ${speaking ? '0.4s' : '1.2s'} steps(1) infinite, npc-glow 2s ease-in-out infinite` } : {}),
        }} />
      ) : (
        // Static fallback (uses 128x128 portrait)
        <img
          src={config.static}
          width={size}
          height={size}
          style={{
            imageRendering: 'pixelated',
            borderRadius: '4px',
            border: active ? '2px solid #f0e68c' : '2px solid transparent',
            display: 'block',
            animation: active ? 'npc-glow 2s ease-in-out infinite' : 'none',
          }}
          alt=""
        />
      )}
    </div>
  )
}

export function GuildMasterPortrait(props: PortraitProps) {
  return <AnimatedPortrait npcId="guild_master" {...props} />
}

export function CartographerPortrait(props: PortraitProps) {
  return <AnimatedPortrait npcId="cartographer" {...props} />
}

export function QuartermasterPortrait(props: PortraitProps) {
  return <AnimatedPortrait npcId="quartermaster" {...props} />
}

export function BartenderPortrait(props: PortraitProps) {
  return <AnimatedPortrait npcId="bartender" {...props} />
}

export function SagePortrait(props: PortraitProps) {
  return <AnimatedPortrait npcId="sage" {...props} />
}

export const NPC_PORTRAITS: Record<NpcId, React.FC<PortraitProps>> = {
  guild_master: GuildMasterPortrait,
  cartographer: CartographerPortrait,
  quartermaster: QuartermasterPortrait,
  bartender: BartenderPortrait,
  sage: SagePortrait,
}
