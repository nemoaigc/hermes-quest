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

// Hand-curated mapping: actual skill name → best matching icon filename
const EXACT_MAP: Record<string, string> = {
  // coding / software-development
  'code-review':              '/skills/software-engineering/code-review-eye-symbol-with-golden-frame.png',
  'github-code-review':       '/skills/software-engineering/code-review-eye-symbol-with-golden-frame.png',
  'requesting-code-review':   '/skills/software-engineering/code-review-eye-symbol-with-golden-frame.png',
  'codebase-inspection':      '/skills/software-engineering/refactor-golden-wrench-reshaping-code-bl.png',
  'systematic-debugging':     '/skills/software-engineering/debug-magnifying-glass-over-a-red-bug.png',
  'test-driven-development':  '/skills/software-engineering/testing-green-checkmark-on-a-shield.png',
  'writing-plans':            '/skills/software-engineering/architecture-blueprint-scroll-with-castl.png',
  'subagent-driven-development': '/skills/software-engineering/microservices-cluster-of-small-connected.png',
  'basic-programming':        '/skills/software-engineering/python-snake-coiled-around-a-code-scroll.png',
  'codex':                    '/skills/software-engineering/typescript-blue-diamond-with-ts-rune.png',
  'github-auth':              '/skills/software-engineering/oauth-golden-token-with-key-hole.png',
  'github-issues':            '/skills/software-engineering/git-branching-tree-with-red-nodes.png',
  'github-pr-workflow':       '/skills/software-engineering/git-branching-tree-with-red-nodes.png',
  'github-repo-management':   '/skills/software-engineering/database-golden-cylinder-with-sparkle.png',

  // research
  'arxiv':                    '/skills/research-knowledge/literature-review-open-book-with-magnify.png',
  'blogwatcher':              '/skills/research-knowledge/nlp-speech-bubble-with-neural-pattern.png',
  'domain-intel':             '/skills/research-knowledge/data-analysis-bar-chart-crystal-ball.png',
  'duckduckgo-search':        '/skills/research-knowledge/hypothesis-lightbulb-with-question-mark.png',
  'ocr-and-documents':        '/skills/research-knowledge/academic-writing-quill-pen-on-paper.png',

  // automation
  'google-workspace':         '/skills/automation-tools/integration-puzzle-pieces-connecting.png',
  'himalaya':                 '/skills/automation-tools/email-envelope-with-wing-feathers.png',
  'obsidian':                 '/skills/automation-tools/file-processing-folder-with-spinning-gea.png',
  'nano-pdf':                 '/skills/automation-tools/pdf-red-document-with-seal-stamp.png',
  'powerpoint':               '/skills/automation-tools/file-processing-folder-with-spinning-gea.png',
  'mcporter':                 '/skills/automation-tools/mcp-server-crystal-server-tower-with-plu.png',
  'native-mcp':               '/skills/automation-tools/mcp-server-crystal-server-tower-with-plu.png',
  'hermes-agent-spawning':    '/skills/automation-tools/deploy-rocket-launching-upward.png',

  // creative
  'ascii-art':                '/skills/creative-arts/pixel-art-tiny-grid-with-colored-squares.png',
  'ascii-video':              '/skills/creative-arts/animation-film-strip-with-movement-lines.png',
  'excalidraw':               '/skills/creative-arts/drawing-pencil-with-rainbow-trail.png',
  'find-nearby':              '/skills/creative-arts/photography-camera-lens-with-light-rays.png',

  // other
  'quest':                    '/skills/software-engineering/api-golden-key-with-gear-teeth.png',
  'dogfood':                  '/skills/automation-tools/cli-tools-hammer-and-chisel.png',
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

  // 2. Category-based hash fallback (for future/unknown skills)
  if (!manifest) return null
  const continent = CAT_TO_CONTINENT[category || ''] || 'software-engineering'
  const files = manifest.skills[continent]
  if (!files || files.length === 0) return null
  const idx = hash(key) % files.length
  return `/skills/${continent}/${files[idx]}`
}

/**
 * Get icon path for an item by type.
 */
export function getItemIconPath(type: string): string | null {
  if (!manifest) return null
  const typeMap: Record<string, string> = {
    'scroll': 'scrolls', 'research_note': 'scrolls',
    'book': 'books', 'training_report': 'books',
    'code_snippet': 'scrolls', 'code': 'scrolls',
    'map_fragment': 'equipment', 'map': 'equipment',
  }
  const cat = typeMap[type.toLowerCase()] || 'scrolls'
  const files = manifest.items[cat]
  if (!files || files.length === 0) return null
  const idx = hash(type.toLowerCase()) % files.length
  return `/items/${cat}/${files[idx]}`
}

export function getSkillIconsForContinent(continentId: string): string[] {
  if (!manifest) return []
  const files = manifest.skills[continentId] || []
  return files.map(f => `/skills/${continentId}/${f}`)
}
