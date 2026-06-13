# Play Sheet Music Agent Guide

This file applies to the entire repository.

## Product Constraints

- Keep the deployed frontend useful without the local OMR service.
- Describe PDF recognition as supporting clean, printed common Western notation only.
- Never imply that handwritten scores are supported.
- User files remain local to the browser or local companion service.
- Do not add hosted OMR without authentication, abuse controls, isolated storage, and an AGPL compliance review.
- Keep GitHub Pages as a testing deploy and Vercel as production.

## Engineering Constraints

- Use shared contracts from `packages/contracts` for API payloads and job states.
- Keep Verovio and audio scheduling behind adapters so they remain testable.
- Cancel and clear scheduled audio whenever the score or timing changes.
- Preserve keyboard access, visible focus, reduced motion, and live status announcements.
- Run lint, typecheck, tests, and both Vercel-root and Pages-subpath builds before completion.

## Documentation

- `README.md` is the public product entrypoint.
- `PROJECT_MEMORY.md` stores stable decisions.
- `docs/architecture.md` describes system boundaries.
- `tasks/current-plan.md` records the active implementation outcome.
