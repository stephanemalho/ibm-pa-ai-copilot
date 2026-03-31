# Setup

## Prerequisites

- Node.js 20+
- pnpm 10+

## Install

```bash
pnpm install
```

## Configure environment

Create a local environment file from the example:

```bash
cp .env.example .env.local
```

For the current POC, the defaults are enough to boot locally. IBM Planning Analytics and external AI provider settings are optional placeholders for now.

## Run locally

```bash
pnpm dev
```

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm format:check
```

## Routes

- `/`
- `/chat`
- `/api/health`

## Next build

```bash
pnpm build
pnpm start
```
