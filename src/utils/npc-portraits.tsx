/** Pixel art NPC portraits — 32x32 rendered from 16x16 grid */

interface PortraitProps {
  size?: number
}

/** Guild Master — authority figure, warm gold/brown tones */
export function GuildMasterPortrait({ size = 32 }: PortraitProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      {/* crown */}
      <rect x="5" y="0" width="1" height="1" fill="#ffd700" />
      <rect x="7" y="0" width="2" height="1" fill="#ffd700" />
      <rect x="10" y="0" width="1" height="1" fill="#ffd700" />
      <rect x="4" y="1" width="8" height="1" fill="#daa520" />
      <rect x="4" y="2" width="8" height="1" fill="#b8860b" />
      {/* face */}
      <rect x="5" y="3" width="6" height="5" fill="#deb887" />
      <rect x="6" y="4" width="1" height="1" fill="#222" />
      <rect x="9" y="4" width="1" height="1" fill="#222" />
      <rect x="6" y="6" width="4" height="1" fill="#a0522d" /> {/* mustache */}
      <rect x="7" y="7" width="2" height="1" fill="#c87050" />
      {/* body — armor */}
      <rect x="3" y="8" width="10" height="1" fill="#8b7355" />
      <rect x="3" y="9" width="10" height="4" fill="#6b5b3a" />
      <rect x="7" y="9" width="2" height="3" fill="#daa520" /> {/* medal */}
      {/* arms */}
      <rect x="2" y="9" width="1" height="3" fill="#deb887" />
      <rect x="13" y="9" width="1" height="3" fill="#deb887" />
      {/* legs */}
      <rect x="5" y="13" width="2" height="2" fill="#4a3728" />
      <rect x="9" y="13" width="2" height="2" fill="#4a3728" />
      <rect x="4" y="15" width="3" height="1" fill="#3a2a1a" />
      <rect x="9" y="15" width="3" height="1" fill="#3a2a1a" />
    </svg>
  )
}

/** Cartographer — scholarly look, map tools, blue/brown */
export function CartographerPortrait({ size = 32 }: PortraitProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      {/* beret */}
      <rect x="5" y="0" width="7" height="1" fill="#4a6fa5" />
      <rect x="4" y="1" width="8" height="2" fill="#3a5a8a" />
      {/* face — older, spectacles */}
      <rect x="5" y="3" width="6" height="5" fill="#d2b48c" />
      <rect x="5" y="4" width="3" height="2" fill="none" stroke="#8b7355" strokeWidth="0.3" /> {/* left lens */}
      <rect x="8" y="4" width="3" height="2" fill="none" stroke="#8b7355" strokeWidth="0.3" /> {/* right lens */}
      <rect x="6" y="5" width="1" height="1" fill="#222" />
      <rect x="9" y="5" width="1" height="1" fill="#222" />
      <rect x="7" y="7" width="2" height="1" fill="#b87050" />
      {/* body — scholarly robe */}
      <rect x="3" y="8" width="10" height="1" fill="#2a4a6a" />
      <rect x="3" y="9" width="10" height="4" fill="#1a3a5a" />
      <rect x="7" y="10" width="2" height="2" fill="#c8a87a" /> {/* scroll */}
      {/* arms */}
      <rect x="2" y="9" width="1" height="3" fill="#d2b48c" />
      <rect x="13" y="9" width="1" height="3" fill="#d2b48c" />
      {/* legs */}
      <rect x="5" y="13" width="2" height="2" fill="#2a3a4a" />
      <rect x="9" y="13" width="2" height="2" fill="#2a3a4a" />
      <rect x="4" y="15" width="3" height="1" fill="#1a2a3a" />
      <rect x="9" y="15" width="3" height="1" fill="#1a2a3a" />
    </svg>
  )
}

/** Quartermaster — merchant, apron, practical look */
export function QuartermasterPortrait({ size = 32 }: PortraitProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      {/* hat */}
      <rect x="5" y="0" width="6" height="1" fill="#8b4513" />
      <rect x="3" y="1" width="10" height="1" fill="#8b4513" />
      <rect x="4" y="2" width="8" height="2" fill="#a0522d" />
      {/* face */}
      <rect x="5" y="4" width="6" height="4" fill="#deb887" />
      <rect x="6" y="5" width="1" height="1" fill="#222" />
      <rect x="9" y="5" width="1" height="1" fill="#222" />
      <rect x="7" y="7" width="2" height="1" fill="#c87050" />
      {/* body — apron */}
      <rect x="4" y="8" width="8" height="1" fill="#556b2f" />
      <rect x="3" y="9" width="10" height="4" fill="#f5f5dc" />
      <rect x="6" y="9" width="4" height="4" fill="#f0e68c" />
      <rect x="7" y="10" width="2" height="1" fill="#daa520" />
      {/* arms */}
      <rect x="2" y="9" width="1" height="3" fill="#deb887" />
      <rect x="13" y="9" width="1" height="3" fill="#deb887" />
      {/* legs */}
      <rect x="5" y="13" width="2" height="2" fill="#4a3728" />
      <rect x="9" y="13" width="2" height="2" fill="#4a3728" />
      <rect x="4" y="15" width="3" height="1" fill="#3a2a1a" />
      <rect x="9" y="15" width="3" height="1" fill="#3a2a1a" />
    </svg>
  )
}

export const NPC_PORTRAITS = {
  guild_master: GuildMasterPortrait,
  cartographer: CartographerPortrait,
  quartermaster: QuartermasterPortrait,
} as const
