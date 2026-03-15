# Hermes Quest Dashboard

A self-evolving RPG adventure dashboard for the Hermes AI agent. Track your adventurer's growth, interact with tavern NPCs, explore knowledge maps, and complete quests -- all rendered as a pixel-art RPG experience.

![Screenshot](docs/screenshot-placeholder.png)

## Features

- **Tavern NPCs** -- Chat with 5 unique characters (Guild Master, Cartographer, Quartermaster, Bartender, Sage), each with distinct personalities and powered by LLM
- **Knowledge Map** -- Visualize skill domains as explorable RPG regions with fog-of-war
- **Quest Board** -- Accept, track, and complete learning quests with XP/gold rewards
- **Adventurer Stats** -- HP, MP, XP, level, class, and title progression
- **Inventory Bag** -- Collect items, research notes, and skill drops
- **Tavern Ambient Chat** -- NPCs discuss your progress among themselves
- **Rumors Board** -- Real-time X/Twitter integration as tavern gossip
- **Reflection System** -- HP depletion triggers introspective letters from your guild

## Quick Start

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build**: Vite 8
- **State**: Zustand
- **Testing**: Vitest + Testing Library
- **Backend**: FastAPI (Python) at port 8420
- **LLM**: GPT via Codex OAuth

## Project Structure

```
src/
  components/   # React UI components
  hooks/        # Custom React hooks
  store/        # Zustand state management
  types/        # TypeScript type definitions
  utils/        # Utility functions
  assets/       # Pixel art sprites and backgrounds
```

## License

MIT -- see [LICENSE](LICENSE).
