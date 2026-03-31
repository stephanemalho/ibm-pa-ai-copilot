# Codex Project Notes

## Working norms

- Use TypeScript only.
- Do not introduce `any`.
- Prefer `type` over `interface`.
- Keep route files thin and move reusable logic into `src/`.
- Keep server-only code under `src/server/`.
- Validate runtime configuration with Zod before using it.
- Prefer small, explicit modules over broad abstractions.

## Architecture intent

- `src/server/ibm-pa/` is the seam for IBM Planning Analytics integration.
- `src/server/ai/` is the seam for provider-agnostic AI orchestration.
- `src/features/chat/` owns chat-specific UI and composition.

## Guardrails

- Do not add Claude-specific files or workflows.
- Do not implement IBM auth or provider logic until explicitly requested.
- Keep shadcn/ui usage limited to foundational components.
