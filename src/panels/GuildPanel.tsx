import { useState } from 'react'
import BulletinBoard from './BulletinBoard'
import QuestTracker from './QuestTracker'

export default function GuildPanel() {
  const [trackerOpen, setTrackerOpen] = useState(false)

  return (
    <div style={{
      width: '100%', height: '100%',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Bulletin board fills entire panel */}
      <BulletinBoard />

      {/* Quest tracker — collapsible overlay at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 20, transition: 'transform 0.2s ease',
        transform: trackerOpen ? 'translateY(0)' : 'translateY(calc(100% - 22px))',
      }}>
        {/* Toggle tab */}
        <div
          onClick={() => setTrackerOpen(!trackerOpen)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '6px', padding: '4px 12px',
            background: 'rgba(20,12,5,0.9)',
            borderTop: '2px solid #8b5e3c',
            cursor: 'pointer',
          }}
        >
          <span style={{
            fontFamily: 'var(--font-pixel)', fontSize: '6px',
            color: '#c8a87a', letterSpacing: '1px',
          }}>
            ACTIVE QUESTS {trackerOpen ? '▼' : '▲'}
          </span>
        </div>
        {/* Tracker content */}
        <div style={{
          background: 'rgba(13,10,8,0.95)',
          padding: '6px',
          maxHeight: '45%',
          overflow: 'auto',
        }}>
          <QuestTracker />
        </div>
      </div>
    </div>
  )
}
