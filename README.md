<div align="center">
  <h2><code>snips</code></h2>
  <p>minimal, fast, personal (and shared) code snippet vault.</p>
</div>

## features

- organize your code snippets
- public sharing + `/public` discovery
- fast tag search, themes
- magic link auth

- AI assistant (improve, refactor, debug, explain)
- optional AI search, auto-tags, docs

- built-in runner/preview (`py`, `cpp`, `md`, WIP: `html`, `css`, + `js`)
- stats, metadata + flexible copy modes

## stack

sveltekit • svelte 5 • typescript • tailwind
supabase (postgres + auth)
shiki • codemirror

providers: openai • anthropic • gemini • openrouter • openai-compatible

## preview

dashboard
![Snippets dashboard](docs/screenshots/snippets-dashboard.png)

explorer
![Workspace explorer](docs/screenshots/workspace-explorer-light.png)

ai panel
![AI edits panel](docs/screenshots/ai-edits-panel.png)

## local setup

```bash
bun i
bun dev

2. create `.env.local`

```env
SUPABASE_URL=your-project-url
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
APP_URL=https://your-production-domain.com
```

optional ai:

```env
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=
# optional: enable dev debug panel for a specific account (dev only)
DEV_OWNER_EMAIL=
```

3. run supabase/schema.sql and refresh api cache

## keyboard shortcuts

- n new snippet
- ? shortcuts
- esc close / clear
- cmd/ctrl + enter save
- e edit • c copy
- pin -> stays on top
- share -> public link
- tags -> comma-separated
- AI -> improve / refactor / debug / explain
- run -> python (local), cpp (external)

## notes

- python runs in-browser (pyodide)
- cpp requires external runner
- execution returns stdout, stderr, runtime, memory
- stats: lines, chars, views, copies
- metadata: views, copies, timestamps
- tags deduped, lowercase, 30 char max
- theme + settings persist locally
- fast: cached highlighting, efficient filtering

## scripts

```bash
bun run lint
bunx tsc --noEmit
bun run build
```

## contributing

- see [CONTRIBUTING.md](CONTRIBUTING.md)

## deploy

vercel ready; make sure supabase auth url is configured

### made with :) by jayan
