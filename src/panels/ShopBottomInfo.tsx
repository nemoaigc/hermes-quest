import { useMemo } from 'react'
import { useStore } from '../store'
import { SOURCE_COLOR } from '../constants/theme'
import PanelCard from '../components/PanelCard'

/** SHOP bottom — left: source shops, right: skills from selected source */
export default function ShopBottomInfo() {
  const shopFilter = useStore((s) => s.shopFilter)
  const setShopFilter = useStore((s) => s.setShopFilter)
  const sourceFilter = useStore((s) => s.shopSourceFilter)
  const setSourceFilter = useStore((s) => s.setShopSourceFilter)
  const shopPage = useStore((s) => s.shopPage)
  const setShopPage = useStore((s) => s.setShopPage)

  const hubSkills = useStore((s) => s.hubSkills)

  // Dedup + filter
  const displayed = useMemo(() => {
    // Deduplicate by identifier (unique per skill)
    const seen = new Set<string>()
    let list = hubSkills.filter(s => {
      const key = s.identifier || s.name
      if (!s.name || seen.has(key)) return false
      seen.add(key)
      return true
    })
    if (sourceFilter) {
      list = list.filter((s) => {
        const src = s.trust_level === 'builtin' ? 'official' : s.source
        return src === sourceFilter
      })
    }
    if (shopFilter.trim()) {
      const q = shopFilter.toLowerCase()
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      )
    }
    return list
  }, [hubSkills, shopFilter, sourceFilter])

  // Count sources for filter chips (deduped by identifier)
  const sourceCounts = useMemo(() => {
    const seen = new Set<string>()
    const m = new Map<string, number>()
    for (const sk of hubSkills) {
      const key = sk.identifier || sk.name
      if (!sk.name || seen.has(key)) continue
      seen.add(key)
      const src = sk.trust_level === 'builtin' ? 'official' : sk.source
      m.set(src, (m.get(src) || 0) + 1)
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [hubSkills])

  const pageSize = 9
  const totalPages = Math.max(1, Math.ceil(displayed.length / pageSize))
  const safePage = Math.min(shopPage, totalPages - 1)
  const pageItems = displayed.slice(safePage * pageSize, (safePage + 1) * pageSize)

  const btnStyle: React.CSSProperties = {
    fontFamily: 'var(--font-pixel)', fontSize: '6px',
    padding: '2px 6px', cursor: 'pointer',
    background: 'rgba(90,60,20,0.4)', border: '1px solid #5c3a1e', color: '#f0e68c',
    lineHeight: 1,
  }
  const btnDisabled: React.CSSProperties = { ...btnStyle, opacity: 0.3, cursor: 'default' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <div style={{ display: 'flex', gap: '6px', flex: 1, minHeight: 0 }}>
      {/* Left: source filter */}
      <PanelCard style={{ minWidth: '110px', overflow: 'auto' }}>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: '#8b7355', marginBottom: '4px', letterSpacing: '1px' }}>SOURCES</div>
        {sourceCounts.map(([src, count]) => (
          <div
            key={src}
            onClick={() => setSourceFilter(sourceFilter === src ? null : src)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '3px 4px', marginBottom: '2px', cursor: 'pointer',
              background: sourceFilter === src ? 'rgba(90,60,20,0.4)' : 'transparent',
              borderLeft: `2px solid ${sourceFilter === src ? SOURCE_COLOR[src] || '#6b4c2a' : 'transparent'}`,
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => { if (sourceFilter !== src) e.currentTarget.style.background = 'rgba(90,60,20,0.2)' }}
            onMouseLeave={e => { if (sourceFilter !== src) e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: SOURCE_COLOR[src] || '#c8a87a', textTransform: 'uppercase' }}>
              {src}
            </span>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: '#8b7355' }}>{count}</span>
          </div>
        ))}
      </PanelCard>

      {/* Right: current page items + pagination */}
      <PanelCard style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: '#8b7355', marginBottom: '3px', letterSpacing: '1px' }}>
          WARES ({displayed.length})
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {pageItems.map(s => (
            <div key={s.identifier} style={{
              fontSize: '9px', color: '#e8d5b0', padding: '3px 0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              borderBottom: '1px solid rgba(107,76,42,0.15)',
            }}>
              <span style={{ color: SOURCE_COLOR[s.trust_level === 'builtin' ? 'official' : s.source] || '#8a8a8a', marginRight: '4px', fontSize: '5px' }}>
                {(s.trust_level === 'builtin' ? 'official' : s.source).slice(0, 3).toUpperCase()}
              </span>
              {s.name}
            </div>
          ))}
        </div>
        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '3px', paddingTop: '3px', borderTop: '1px solid rgba(107,76,42,0.3)' }}>
          <button
            onClick={() => safePage > 0 && setShopPage(safePage - 1)}
            style={safePage > 0 ? btnStyle : btnDisabled}
            disabled={safePage <= 0}
          >&#9664;</button>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '5px', color: '#c8a87a' }}>
            {safePage + 1} / {totalPages}
          </span>
          <button
            onClick={() => safePage < totalPages - 1 && setShopPage(safePage + 1)}
            style={safePage < totalPages - 1 ? btnStyle : btnDisabled}
            disabled={safePage >= totalPages - 1}
          >&#9654;</button>
        </div>
      </PanelCard>
      </div>
      {/* Search bar at bottom */}
      <input
        value={shopFilter}
        onChange={e => setShopFilter(e.target.value)}
        placeholder="Search skills..."
        style={{
          width: '100%', marginTop: '4px', padding: '4px 8px',
          fontFamily: 'var(--font-pixel)', fontSize: '7px',
          background: 'rgba(15,10,5,0.6)', border: '1px solid #5c3a1e',
          color: '#f0e68c', outline: 'none', boxSizing: 'border-box',
          flexShrink: 0,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#f0e68c' }}
        onBlur={e => { e.currentTarget.style.borderColor = '#5c3a1e' }}
      />
    </div>
  )
}
