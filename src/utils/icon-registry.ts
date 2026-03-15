/**
 * Icon Registry — loads icon manifest at runtime, assigns icons by category + hash.
 * No hardcoded filenames — reads actual file list from /icon-manifest.json.
 */

type Manifest = {
  skills: Record<string, string[]>  // continent → filenames
  items: Record<string, string[]>   // category → filenames
}

let manifest: Manifest | null = null
let loadPromise: Promise<void> | null = null

// Category → continent mapping
const CAT_TO_CONTINENT: Record<string, string> = {
  'coding': 'software-engineering',
  'software-development': 'software-engineering',
  'research': 'research-knowledge',
  'automation': 'automation-tools',
  'creative': 'creative-arts',
  'media': 'creative-arts',
  'quest': 'software-engineering',
  'dogfood': 'automation-tools',
  'gaming': 'creative-arts',
  'mlops': 'research-knowledge',
  'leisure': 'creative-arts',
}

// Hand-curated mapping: actual skill name → generated icon
const EXACT_MAP: Record<string, string> = {
  // coding / software-development (b1)
  'code-review':              '/skills/generated/skill-review.png',
  'github-code-review':       '/skills/generated/skill-review.png',
  'requesting-code-review':   '/skills/generated/skill-review.png',
  'codebase-inspection':      '/skills/generated/skill-inspect.png',
  'systematic-debugging':     '/skills/generated/skill-debug.png',
  'test-driven-development':  '/skills/generated/skill-test.png',
  'writing-plans':            '/skills/generated/skill-plan.png',
  'plan':                     '/skills/generated/skill-plan.png',
  'subagent-driven-development': '/skills/generated/skill-agent.png',
  'basic-programming':        '/skills/generated/skill-basic.png',
  'codex':                    '/skills/generated/skill-codex.png',
  'opencode':                 '/skills/generated/skill-opencode.png',
  'github-auth':              '/skills/generated/skill-auth.png',
  'github-issues':            '/skills/generated/skill-issues.png',
  'github-pr-workflow':       '/skills/generated/skill-pr.png',
  'github-repo-management':   '/skills/generated/skill-repo.png',

  // research (b3)
  'arxiv':                    '/skills/generated/skill-arxiv.png',
  'blogwatcher':              '/skills/generated/skill-blogs.png',
  'domain-intel':             '/skills/generated/skill-intel.png',
  'duckduckgo-search':        '/skills/generated/skill-search.png',
  'ocr-and-documents':        '/skills/generated/skill-ocr.png',
  'parallel-cli':             '/skills/generated/skill-parallel.png',

  // automation (b2)
  'google-workspace':         '/skills/generated/skill-suite.png',
  'himalaya':                 '/skills/generated/skill-email.png',
  'obsidian':                 '/skills/generated/skill-obsidian.png',
  'nano-pdf':                 '/skills/generated/skill-pdf-tool.png',
  'powerpoint':               '/skills/generated/skill-ppt.png',
  'mcporter':                 '/skills/generated/skill-porter.png',
  'native-mcp':               '/skills/generated/skill-mcp.png',
  'hermes-agent-spawning':    '/skills/generated/skill-spawn.png',
  'linear':                   '/skills/generated/skill-linear.png',

  // creative (b3)
  'ascii-art':                '/skills/generated/skill-ascii.png',
  'ascii-video':              '/skills/generated/skill-ascii.png',
  'excalidraw':               '/skills/generated/skill-draw.png',
  'find-nearby':              '/skills/generated/skill-explore.png',
  'jupyter-live-kernel':      '/skills/generated/skill-jupyter.png',

  // other (b4)
  'quest':                    '/skills/generated/skill-quest.png',
  'dogfood':                  '/skills/generated/skill-dogfood.png',
  'xitter':                   '/skills/generated/skill-twitter.png',

  // fallback coding icons (b1)
  '':                         '/skills/generated/skill-code.png',
}

// Deterministic hash
function hash(s: string): number {
  let h = 0x9e3779b9
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

async function loadManifest() {
  try {
    const res = await fetch('/icon-manifest.json')
    manifest = await res.json()
  } catch {
    manifest = { skills: {}, items: {} }
  }
}

export function ensureManifestLoaded(): Promise<void> {
  if (manifest) return Promise.resolve()
  if (!loadPromise) loadPromise = loadManifest()
  return loadPromise
}

// Eagerly load on import
ensureManifestLoaded()

/**
 * Get icon path for a skill by name + category.
 * Uses deterministic hash so same name always gets same icon.
 */
export function getSkillIconPath(name: string, category?: string): string | null {
  const key = name.toLowerCase().trim()

  // 1. Exact curated match
  if (EXACT_MAP[key]) return EXACT_MAP[key]

  // 2. Fallback to generated skill icons (hash-based)
  const generatedIcons = [
    'review','github','debug','test','plan','code','arch','git',
    'obsidian','mcp','email','linear','pdf-tool','ppt','suite','spawn',
    'arxiv','blogs','intel','search','ocr','ascii','draw','jupyter',
    'quest','dogfood','twitter','explore','codex','opencode','pr','cli',
    'parallel','agent','inspect','issues','repo','auth','porter','basic',
  ]
  const idx = hash(key) % generatedIcons.length
  return `/skills/generated/skill-${generatedIcons[idx]}.png`
}

/**
 * Get icon path for an item by type.
 */
// File extension icons available in /items/
const FILE_TYPE_ICONS = new Set([
  'md','txt','pdf','docx','xlsx','pptx','csv',
  'py','js','ts','json','yaml','html','css',
  'png','jpg','mp3','mp4','svg',
  'zip','tar','log','sh','env','sql','docker','git',
])

export function getItemIconPath(type: string): string | null {
  // Check for file extension icon first (e.g. icon="md" → /items/item-md.png)
  const lower = (type || '').toLowerCase()
  if (FILE_TYPE_ICONS.has(lower)) {
    return `/items/item-${lower}.png`
  }

  if (!manifest) return null
  const typeMap: Record<string, string> = {
    'scroll': 'scrolls', 'research_note': 'scrolls',
    'book': 'books', 'training_report': 'books',
    'code_snippet': 'scrolls', 'code': 'scrolls',
    'map_fragment': 'equipment', 'map': 'equipment',
  }
  const cat = typeMap[lower] || 'scrolls'
  const files = manifest.items[cat]
  if (!files || files.length === 0) return null
  const idx = hash(lower) % files.length
  return `/items/${cat}/${files[idx]}`
}

export function getSkillIconsForContinent(continentId: string): string[] {
  if (!manifest) return []
  const files = manifest.skills[continentId] || []
  return files.map(f => `/skills/${continentId}/${f}`)
}
