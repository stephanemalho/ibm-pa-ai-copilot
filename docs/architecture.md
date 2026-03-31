# Architecture

## Goals

This POC optimizes for clarity, maintainability, and safe future evolution. It sets up the application boundary lines needed for IBM Planning Analytics access, chat orchestration, and swappable LLM providers without prematurely implementing provider-specific logic.

## High-level layout

### `app/`

Route entrypoints, layouts, and API routes. Keep route files thin and delegate reusable logic into `src/`.

### `src/features/chat/`

Feature-focused UI and feature-specific composition logic for the chat experience.

### `src/components/ui/`

Shared presentational building blocks generated in the shadcn/ui style. Only foundational components belong here.

### `src/server/`

Server-side application logic and integration boundaries.

### `src/server/ibm-pa/`

IBM Planning Analytics-specific configuration and future client/authentication code.

### `src/server/ai/`

AI provider types, registry decisions, and future orchestration entrypoints. This is the seam for Vercel AI SDK and provider switching.

### `src/shared/env/`

Environment validation and runtime-safe configuration access using Zod.

### `src/shared/lib/`

Shared utilities, route constants, and app metadata.

### `src/shared/types/`

Cross-cutting application types that are safe to reuse across features and server modules.

## Design principles

- Route handlers stay thin.
- Validation happens at boundaries.
- Server concerns stay out of UI components.
- Provider-specific logic is isolated behind `src/server/ai/`.
- IBM Planning Analytics concerns are isolated behind `src/server/ibm-pa/`.
- Shared types and utilities stay small and explicit.

## Ready for step 2

The current structure is intentionally prepared for:

- IBM Planning Analytics API clients and auth flows
- Vercel AI SDK request/stream orchestration
- Multiple model providers with a swappable registry
- Feature growth inside `src/features/chat/` without bloating route files

## Current non-goals

- No IBM authentication yet
- No LLM provider implementation yet
- No durable storage yet
- No multi-agent orchestration layer yet
