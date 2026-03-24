# 0001. Export Contract and Quality Gate Truth Alignment

## Status

Accepted

## Context

The project had drift between implemented behavior and documented behavior across export, API contract artifacts, and verification commands. This created false confidence: builds could pass while docs/check scripts were stale, and user-facing documentation described outdated functionality.

## Decision

We standardized on the following:

- The supported export surface is `export_pdf` and the UI action is "Export PDF".
- `openapi/openapi.generated.json` is generated from `scripts/docs/generate-contract.mjs` and validated by `scripts/docs/check-contract.mjs`.
- Verification commands in `.codex/verify.commands` must map directly to runnable package scripts.
- Coverage output must include `lcov` so diff-coverage gates consume a real artifact.
- Public README and privacy documentation must describe implemented behavior (local SQLite API key storage and PDF export).

## Consequences

- Quality gates now fail on real drift instead of silently passing.
- PM and engineering views of the product are aligned to shipped functionality.
- We accept minor maintenance overhead to keep generated artifacts and docs synchronized.

## Alternatives Considered

- Keep manual OpenAPI and docs updates only: rejected because drift reappeared repeatedly.
- Keep Markdown and PDF export in parallel: rejected for now to avoid dual-surface maintenance while only PDF is wired end-to-end.
- Skip docs checks in CI: rejected because it allows command/API drift to ship.
