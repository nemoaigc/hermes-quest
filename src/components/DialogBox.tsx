import { useState, useEffect } from 'react'

interface DialogProps {
  speaker: string
  portrait: React.ReactNode
  text: string
  onClose: () => void
  choices?: Array<{ label: string; action: () => void }>
}

export default function DialogBox({ speaker, portrait, text, onClose, choices }: DialogProps) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    const interval = setInterval(() => {
      i++
      if (i >= text.length) {
        setDisplayed(text)
        setDone(true)
        clearInterval(interval)
      } else {
        setDisplayed(text.slice(0, i))
      }
    }, 25)
    return () => clearInterval(interval)
  }, [text])

  function handleClick() {
    if (!done) {
      setDisplayed(text)
      setDone(true)
    } else if (!choices || choices.length === 0) {
      onClose()
    }
  }

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'linear-gradient(180deg, #1a140c 0%, #0d0a06 100%)',
        border: '2px solid #5c3a1e',
        borderBottom: 'none',
        padding: '8px',
        cursor: 'pointer',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.6)',
      }}
    >
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        {/* Portrait */}
        <div style={{
          width: 40, height: 40, flexShrink: 0,
          background: '#0a0804', border: '2px solid #3a2a1a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {portrait}
        </div>

        {/* Text area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-pixel)', fontSize: '7px',
            color: '#f0e68c', marginBottom: '4px',
          }}>
            {speaker}
          </div>
          <div style={{
            fontSize: '10px', color: '#c8a87a', lineHeight: '1.5',
            fontFamily: 'var(--font-mono)',
            minHeight: '28px',
          }}>
            {displayed}
            {!done && <span style={{ opacity: 0.5 }}>|</span>}
          </div>

          {/* Choices */}
          {done && choices && choices.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              {choices.map((c, i) => (
                <button
                  key={i}
                  className="pixel-btn"
                  onClick={(e) => { e.stopPropagation(); c.action() }}
                  style={{
                    fontSize: '7px', borderColor: '#5c3a1e', color: '#f0e68c',
                    background: 'rgba(90,60,20,0.3)',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* Continue hint */}
          {done && (!choices || choices.length === 0) && (
            <div style={{
              fontSize: '7px', color: '#5c3a1e', fontFamily: 'var(--font-pixel)',
              marginTop: '4px', textAlign: 'right',
            }}>
              CLICK TO CONTINUE
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
