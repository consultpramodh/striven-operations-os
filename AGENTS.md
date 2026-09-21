# Striven Operations OS — Agent Operating Rules

## Goal

Build a reliable, API-native operations layer for Striven that can discover tenant configuration, execute bounded workflows safely, verify outcomes, and remain maintainable as tenant schemas change.

## Core rules

- Striven is the source of truth for operational records.
- Never guess IDs, custom-field identities, or entity relationships.
- Stage 0 is read-only: GET and explicit POST /Search only.
- Search before create once writes are introduced.
- All mutations must pass one write gate and be idempotent, auditable, and verified.
- Breaking schema drift pauses only affected workflows.
- Prefer deterministic code over model reasoning when the answer is computable.
- Use AI to classify, rank, explain, or investigate; do not let a model invent operational facts.
- Keep tenant secrets and tenant record data out of Git.

## Skill routing

Use repo-local skills in `.agents/skills/` when the task matches them.

- `striven-tenant-discovery`: bootstrap/read-only discovery.
- `striven-domain-modeling`: entity meanings, relationships, lifecycle rules.
- `striven-api-contract`: endpoint and payload contract verification.
- `striven-schema-drift`: custom-field/configuration change handling.
- `striven-write-safety`: mutation risk, idempotency, write-gate review.
- `striven-runtime-verification`: black-box proof after implementation.
- `striven-change-review`: independent scoped review of changes.
- `striven-handoff`: durable continuation context.

## Third-party skills

Do not install or execute third-party skills directly.

Before adopting one:

1. record upstream repo, commit/tag, and license;
2. inspect scripts, tool access, network behavior, and secret handling;
3. extract the useful method rather than copying unnecessary instructions;
4. adapt it into a repo-local skill with a narrower authority boundary;
5. add tests/evals where the skill can affect code, data, or external systems.

See `docs/UPSTREAM_SKILLS.md`.
