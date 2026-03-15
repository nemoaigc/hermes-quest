/** Reusable RPG panel card */
export default function PanelCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      padding: '6px 8px',
      background: 'linear-gradient(180deg, rgba(20,14,8,0.7) 0%, rgba(10,8,4,0.8) 100%)',
      border: '1px solid rgba(139,94,60,0.4)',
      borderTop: '1px solid rgba(180,140,80,0.2)',
      borderRadius: '2px',
      boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.5), 0 1px 0 rgba(139,94,60,0.15)',
      ...style,
    }}>{children}</div>
  )
}
