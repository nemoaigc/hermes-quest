/** Shared back button style */
export default function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: 'var(--font-pixel)', fontSize: '6px', padding: '4px 10px',
      background: 'transparent', border: '1px solid rgba(139,94,60,0.5)',
      color: '#8b7355', cursor: 'pointer', letterSpacing: '1px',
      transition: 'all 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#f0e68c'; e.currentTarget.style.color = '#f0e68c' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,94,60,0.5)'; e.currentTarget.style.color = '#8b7355' }}
    >{'\u25C0'} BACK</button>
  )
}
