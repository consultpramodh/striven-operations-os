# Upstream Skills and Adaptation Policy

This repository does not blindly install large skill packs. We track useful upstreams, preserve provenance, and adapt only the capabilities that support the Striven Operations OS.

## Core upstreams

| Upstream | License | How we use it |
|---|---|---|
| openclaw/agent-skills | MIT | Behavior validation, review discipline, handoff patterns |
| idaibin/skills | Apache-2.0 | Domain modeling, product/API contract separation, TypeScript implementation/review boundaries |
| obra/superpowers | MIT | Tracked for debugging/TDD/planning patterns; not vendored wholesale |
| upstash/context7 | MIT | Reference for current-library documentation retrieval; treat as a tool/service, not core runtime logic |
| anthropics/skills | Per-file/repo license must be verified before copying | Reference-only until each adopted skill's license and scripts are reviewed |

## Optional business/distribution upstreams

| Upstream | License | Status |
|---|---|---|
| coreyhaines31/marketingskills | MIT | Track for later customer research, positioning, pricing experiments, outreach and analytics |
| charlie947/social-media-skills | MIT | Track for later founder/distribution workflows |
| Jakubantalik/transitions.dev | License requires verification before copying | Reference-only for future UI polish |
| Leonxlnx Taste Skill ecosystem | License requires verification before copying | Reference-only for future UI polish |

## What we adapted now

We authored repo-native skills inspired by the high-level operating patterns above:

- `striven-tenant-discovery`
- `striven-domain-modeling`
- `striven-api-contract`
- `striven-schema-drift`
- `striven-write-safety`
- `striven-runtime-verification`
- `striven-change-review`
- `striven-handoff`

These are intentionally narrower than the upstream packs and are specific to this product.

## Intake rule for any new skill

A third-party skill is not trusted merely because it is popular.

Before adaptation, record:

- upstream repository and immutable commit/tag
- license
- files/scripts executed
- network/tool access
- filesystem write scope
- environment/secrets access
- external side effects
- trigger conditions
- stop conditions
- verification/eval method
- whether the skill can be replaced by deterministic code

Any skill that can write production data, change permissions, expose secrets, or alter Git state requires an explicit repo-local approval boundary.
