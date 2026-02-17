# ARO — Automated Research Orchestrator

## Project Structure
npm workspaces monorepo with 3 packages:
- `packages/shared` — Types, Zod schemas, constants, WS protocol definitions
- `packages/backend` — Express/WS server, CLI (Commander), planner (Kimi K2.5 API), executor, synthesis
- `packages/extension` — Chrome Manifest V3 extension (esbuild)

## Build Commands
```bash
npm run build              # Build all packages
npm run build:shared       # Build shared types (must run first)
npm run build:backend      # Build backend
npm run build:extension    # Build Chrome extension
npm run test               # Run all tests (vitest)
npm run dev                # Start backend dev server
```

## CLI Commands
```bash
npx -w packages/backend aro plan "topic"      # Generate research plan
npx -w packages/backend aro plan "topic" --dry-run  # Plan without saving
npx -w packages/backend aro status            # Show latest session
npx -w packages/backend aro status <id>       # Show specific session
npx -w packages/backend aro synthesize        # Synthesize latest session
npx -w packages/backend aro synthesize --manual  # Write prompt to file
npx -w packages/backend aro health            # Run selector health checks
```

## Conventions
- Strict TypeScript, ESM modules throughout
- Zod for all runtime validation (config files, API responses, WS messages)
- All WebSocket messages follow JSON-RPC style with `id`, `type`, `payload`
- Session data stored as JSON in `research/{session-id}/session.json`
- Raw responses as markdown with YAML frontmatter in `research/{session-id}/raw/`
- Config in `config/llm-targets.json` and `config/settings.json`

## Key Architecture
- Backend server runs on port 7749 (Express + WS)
- Chrome extension connects via WebSocket to backend
- Extension uses content scripts per LLM provider for DOM injection
- Planner uses Kimi K2.5 (Moonshot) API for topic decomposition (OpenAI-compatible)
- Executor orchestrates parallel per-provider queues with dependency resolution
- Synthesis aggregates responses and generates prompts for Claude Code

## Environment
- `KIMI_API_KEY` must be set for the planner
- Extension must be sideloaded in Chrome (developer mode)
