# ARO — Automated Research Orchestrator

Orchestrate deep research across multiple AI models (Claude, ChatGPT, Gemini, Perplexity). ARO decomposes research topics into model-optimized sub-tasks, distributes prompts via a Chrome extension, captures responses, and synthesizes results into a navigable knowledge base.

## Quick Start

### 1. Install Dependencies
```bash
cd C:\repos\aro
npm install
```

### 2. Set API Key
```bash
export KIMI_API_KEY=sk-...
```
Or add to `.env` file in the project root.

### 3. Build
```bash
npm run build
```

### 4. Load Chrome Extension
1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select `C:\repos\aro\packages\extension`

### 5. Run a Research Session
```bash
# Generate a research plan
npx -w packages/backend aro plan "Compare React, Vue, and Svelte for enterprise apps"

# Check session status
npx -w packages/backend aro status

# After execution, synthesize results
npx -w packages/backend aro synthesize
```

## Commands

| Command | Description |
|---------|-------------|
| `aro plan <topic>` | Generate research plan via Claude, approve, and optionally execute |
| `aro plan <topic> --dry-run` | Generate plan without saving |
| `aro status [session-id]` | Show session status and task progress |
| `aro synthesize [session-id]` | Aggregate responses and generate knowledge base |
| `aro synthesize --manual` | Write synthesis prompt to file (for manual use) |
| `aro health` | Test CSS selectors against live LLM sites |

## Architecture

```
CLI (Commander) → Planner (Kimi K2.5 API)
                → Executor → WebSocket → Chrome Extension
                                        → Content Scripts (per LLM provider)
                → Synthesis → Aggregator → Prompt Generator → Claude Code
```

## Project Structure
- `config/` — LLM target definitions, settings
- `research/` — Session output (gitignored)
- `packages/shared/` — Types, schemas, constants
- `packages/backend/` — Server, CLI, planner, executor, synthesis
- `packages/extension/` — Chrome Manifest V3 extension

## Development

```bash
npm run test           # Run tests
npm run dev            # Start backend server
npm run build:extension  # Rebuild extension after changes
```
