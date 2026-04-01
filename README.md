# Analytics XPlorer AI Copilot

Production-minded POC scaffold for an Analytics XPlorer AI Copilot web app built with Next.js App Router, TypeScript, pnpm, Zod, and a minimal shadcn/ui foundation.

## What is included

- Next.js App Router with TypeScript-only setup
- ESLint with the official Next.js configuration
- Prettier with a minimal compatible configuration
- Zod-based environment validation
- Minimal, scalable folder structure for chat, IBM Planning Analytics, and AI provider work
- Placeholder homepage, chat page, and healthcheck API route
- Minimal shadcn/ui primitives for a clean UI base
- Server-side IBM Planning Analytics read-only client with mock fallback mode

## Project structure

```text
app/
src/
  components/ui/
  features/chat/
  server/
    ai/
    ibm-pa/
  shared/
    env/
    lib/
    types/
docs/
.codex/
```

## Quick start

1. Install dependencies:

```bash
pnpm install
```

2. Create a local environment file:

```bash
cp .env.example .env.local
```

3. Start the development server:

```bash
pnpm dev
```

4. Open `http://localhost:3000`

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm format`
- `pnpm format:check`
- `pnpm check`

## IBM Planning Analytics setup

The IBM integration is server-side only and automatically runs in one of two modes:

- `live`: enabled when `IBM_PA_BASE_URL`, `IBM_PA_TENANT_ID`, and `IBM_PA_API_KEY` are all present
- `mock`: used automatically when those variables are missing

Required live variables:

```bash
IBM_PA_BASE_URL=https://xxxxxxxxx.planninganalytics.saas.ibm.com
IBM_PA_TENANT_ID=xxxxxxxx
IBM_PA_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Optional live variable:

```bash
IBM_PA_TM1_SERVER=your_tm1_server_name
```

Authentication details implemented in this POC:

- username: `apikey`
- password: `IBM_PA_API_KEY`
- login endpoint: `/api/{tenantId}/v0/rolemgmt/v1/users/me`
- session cookie: stored server-side in memory and reused for subsequent IBM requests

Example IBM API routes:

- `/api/ibm/health`
- `/api/ibm/servers`
- `/api/ibm/servers/access`
- `/api/ibm/cubes`
- `/api/ibm/cubes/access?server=your_tm1_server_name`
- `/api/ibm/dimensions?cube=Plan_Budget`
- `/api/ibm/dimensions/access?cube=Plan_Budget&server=your_tm1_server_name`
- `/api/ibm/dimensions?cube=Plan_Budget&server=your_tm1_server_name&sampleSize=5`

Use `/api/ibm/servers/access` during setup to see which discovered TM1 servers are actually usable for metadata calls. The route probes each detected server with a lightweight server-side metadata request and reports whether it is accessible, merely visible but unauthorized, not reachable by that endpoint, or failing with an unexpected upstream error.

The homepage now renders those server diagnostics directly, and accessible servers link to `/servers/[serverName]` for read-only cube and dimension exploration. That server view now keeps discovered cubes and dimensions visible even when some are not effectively accessible, so access gaps are explicit instead of hidden.

## Docs

- [Architecture](./docs/architecture.md)
- [Setup](./docs/setup.md)

## Notes

- IBM Planning Analytics integration is read-only in this step.
- No IBM credentials are exposed to client components or `NEXT_PUBLIC` variables.
- AI provider logic is intentionally scaffolded, not implemented.
- The architecture is ready for IBM PA integration, Vercel AI SDK wiring, and swappable LLM providers in a later step.
