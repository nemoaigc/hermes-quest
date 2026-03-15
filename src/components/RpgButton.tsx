/** Reusable RPG button */
export default function RpgButton({ children, onClick, disabled, small, color }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; small?: boolean; color?: string }) {
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.borderColor = '#f0e68c'; e.currentTarget.style.boxShadow = '0 0 8px rgba(240,230,140,0.3), 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,220,140,0.1)' } }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#6b4c2a'; e.currentTarget.style.boxShadow = disabled ? 'none' : '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,220,140,0.1)' }}
      style={{
      fontFamily: 'var(--font-pixel)', fontSize: small ? '5px' : '6px',
      padding: small ? '4px 8px' : '6px 14px',
      cursor: disabled ? 'wait' : 'pointer',
      background: disabled ? 'rgba(10,8,4,0.5)' : color ? color : 'linear-gradient(180deg, #6a4428 0%, #4a2a14 50%, #3a2210 100%)',
      border: '2px solid #6b4c2a',
      color: '#f0e68c',
      boxShadow: disabled ? 'none' : '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,220,140,0.1)',
      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
      whiteSpace: 'nowrap' as const,
      transition: 'all 0.15s',
    }}>{children}</button>
  )
}
