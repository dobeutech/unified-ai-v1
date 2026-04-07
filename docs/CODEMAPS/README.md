# Codemaps

Small, **hand-maintained** maps of the API surface and `lib/` modules. They exist so agents can jump to the right file without scanning the whole tree.

## When to update

- A new file is added under [`app/api/`](../../app/api/) (new route handler).
- A major split or rename in [`lib/`](../../lib/) (new module or responsibility move).
- The authentication or env requirements of an endpoint change.

Do not treat these files as generated output; keep them accurate in the same PR as code changes when possible.

## Index

- [`api-surface.md`](./api-surface.md) — HTTP routes, methods, auth, main dependencies.
- [`lib-modules.md`](./lib-modules.md) — `lib/**/*.ts` responsibilities and dependents.

For narrative architecture and commands, prefer [`../AGENT_NAVIGATION.md`](../AGENT_NAVIGATION.md) and [`../../CLAUDE.md`](../../CLAUDE.md).
