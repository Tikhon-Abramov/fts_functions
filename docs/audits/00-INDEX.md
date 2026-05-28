# Audits — Index

A multi-dimensional audit of registry-functions. Each file in this folder is one focused audit. Read in any order; the **`50-master-plan.md`** consolidates everything into a sequenced refactor plan.

> Generated 2026-04-28. Author: AI tech-lead session.
> Existing companion docs: `../quality-scorecard.md`, `../improvement-potential.md`, `../patterns.md`, `../architecture.md`. The audits below extend, not replace, those.

## What's in this folder

| #   | File                      | Status     | What it covers                                                                                             |
| --- | ------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| 01  | `frontend-smells.md`      | ✅ done    | apps/web — runMutation swallow, default-mutation, addRow contract lie, primary/extra split, dead constants |
| 02  | `backend-smells.md`       | ✅ done    | apps/api — inline mapped types, dual Prisma import, redundant queries, schema naming lie                   |
| 03  | `architecture-map.md`     | ✅ done    | per-component responsibility map, 3 user-action traces (save row / add fn / add row)                       |
| 04  | `web-research-catalog.md` | ✅ done    | Top 25 smells in TS/React/Nest/Prisma + comment rules + cross-component patterns + obviousness criteria    |
| 05  | `test-coverage.md`        | ⏳ running | tests that rubber-stamp implementation, missing-edge tests, e2e gap                                        |
| 06  | `type-rigor.md`           | ⏳ running | tsconfig strictness, `any` map, branded IDs, inline-mapped-type extraction list                            |
| 07  | `ci-standards.md`         | ⏳ running | current CI, eslint gaps, proposed strict-bar plan (day-1 / week-1 / month-1)                               |
| 08  | `performance.md`          | ⏳ running | Prisma N+1, missing indexes, bundle size, re-render hot spots                                              |
| 09  | `umbrella.md`             | ⏳ running | catch-all dimensions: security, observability, deps, env hygiene, DX                                       |
| 50  | `master-plan.md`          | ⏳ pending | consolidated, sequenced refactor plan with priorities                                                      |
| 90  | `CONVENTIONS.md`          | ⏳ pending | the standards we adopt, enforced via lint/CI                                                               |

## How to use this audit

1. Skim the **top 5 / executive summary** of each file.
2. Read `master-plan.md` for sequencing.
3. Adopt `CONVENTIONS.md` and turn lint rules to error.
4. PRs reference audit IDs (e.g. `Fixes audit:02-be-smells#critical-3`).

## Severity legend used across all files

- **Critical** — causes user-visible bugs OR blocks correctness
- **High** — silent drift, footgun, hard-to-debug
- **Medium** — confusing / requires context to understand / interface noise
- **Low** — cosmetic, dead code, comment hygiene

## Cats `/root/dev/agario` smell docs — UNREACHABLE

The user has personal smell-criteria docs at `/root/dev/agario` on host `cats` (`45.93.23.69`, user `backend_cat`). SSH key authentication fails at the server (key acknowledged, signature rejected). Until the pubkey is re-added to `~backend_cat/.ssh/authorized_keys`, the team-specific rules from those docs are **not folded in**. When access is restored we'll add a separate `91-cats-house-rules.md` and merge.
