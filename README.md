# IBM Planning Analytics AI Copilot

Production-minded POC scaffold for an IBM Planning Analytics AI Copilot web app built with Next.js App Router, TypeScript, pnpm, Zod, and a minimal shadcn/ui foundation.

## What is included

- Next.js App Router with TypeScript-only setup
- ESLint with the official Next.js configuration
- Prettier with a minimal compatible configuration
- Zod-based environment validation
- Minimal, scalable folder structure for chat, IBM Planning Analytics, and AI provider work
- Placeholder homepage, chat page, and healthcheck API route
- Minimal shadcn/ui primitives for a clean UI base

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

## Docs

- [Architecture](./docs/architecture.md)
- [Setup](./docs/setup.md)

## Notes

- IBM Planning Analytics authentication is intentionally not implemented yet.
- AI provider logic is intentionally scaffolded, not implemented.
- The architecture is ready for IBM PA integration, Vercel AI SDK wiring, and swappable LLM providers in a later step.
