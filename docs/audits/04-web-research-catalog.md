# Audit 04 — Web Research: Strict Code-Quality Catalog

> Strict, opinionated catalog distilled from Fowler / Refactoring.Guru / NestJS / Prisma / React community sources. Use as the bar for grading code in this repo.

## Top 25 smells (TS/React/Nest/Prisma) — ranked by "wtf-frequency"

1. **Implicit cross-component coupling** — Component A breaks when Component B's internal state changes.
   _Test_: can you delete a sibling without re-reading it?
2. **`useEffect` as a data-transform pipeline** — effects mutating local state derived from props.
   _Test_: would `useMemo` or rendering-time computation suffice?
3. **Prop drilling > 2 levels** — passing a prop through components that never read it.
4. **Controller doing business logic** — Nest controller branching on domain rules.
5. **Service-as-utility bag** — `UserService` with `formatPhone`, `slugify`, `sendEmail`.
6. **Prisma N+1** — `await Promise.all(items.map(i => prisma.x.findUnique(...)))`.
7. **Missing `@@index`** — schema fields used in `where` / `orderBy` without index.
8. **`any` / `as` / `@ts-ignore`** — escape hatches in domain code.
9. **`Record<string, unknown>` as an API contract** — weakly typed payloads.
10. **Long parameter list (>3) without options object** — positional booleans.
11. **Primitive obsession** — `userId: string` everywhere instead of branded `UserId`.
12. **Magic strings/numbers** — `if (status === 'PENDING_2')`.
13. **Divergent change** — one file changed for unrelated reasons each sprint.
14. **Shotgun surgery** — adding a field requires edits in 6+ files.
15. **Fat module (Nest)** — module exports/imports >10 things, mixes domains.
16. **Provider in wrong module** — leaking via `exports`.
17. **Hook with hidden side effects** — name suggests read-only but it mutates.
18. **Stale `useEffect` deps / lint-disabled deps array** — `// eslint-disable-next-line react-hooks/exhaustive-deps`.
19. **Ref escape hatches** — `useRef` to bypass render flow / mutate during render.
20. **Selecting whole rows** — `prisma.user.findMany()` when only `id, email` needed.
21. **Raw SQL where Prisma suffices (and vice versa)**.
22. **God component** — >250 LOC, >5 `useState`, >3 effects.
23. **Conditional hook calls / hook order instability**.
24. **Dead code & "removed X" comments** — TODOs older than 6 months.
25. **Inappropriate intimacy across layers** — controller importing repository, React component importing Prisma types.

## Comment-quality rules

**Write a comment** only for: WHY (business reason, perf trade-off), WARN (footgun, ordering constraint), LINK (issue/RFC), or INVARIANT (assumption the type system can't express).

**Delete a comment** when: it restates the code (`// increment i`), is stale ("removed X" / "TODO 2023"), is a multi-paragraph essay over a 3-line function, or is auto-generated JSDoc with no extra information.

**Comment-as-smell**: if a block needs a paragraph to be understood, extract a named function instead. Fowler: _"comments are deodorant for bad code."_ A `// HACK:` comment without a ticket is a permanent hack.

## Cross-component logic smells

- **State coupling via context** when only one consumer exists — context is for many, props are for one.
- **Hooks that mutate sibling state** — naming lies.
- **Implicit ordering**: Component B assumes Component A already dispatched something.
- **Shared mutable refs across components** via context — concurrent-render hazard.
- **Derived state stored in `useState`** then synced via effect — single source of truth violated.
- **Event-bus smell**: `window.dispatchEvent` / global emitter to communicate between siblings — invisible coupling.
- **Prop-drilled callbacks that mutate parent state from 4 levels deep** — child knows too much about parent.
- **Backend equivalent**: services injecting each other circularly via `forwardRef`.

## Obviousness checklist (no scrolling required)

A reviewer should answer YES to all:

- File name ≈ the export's name and intent.
- The first 20 lines reveal **what** the unit does and **why it exists**.
- Names are domain-specific (`approveInvoice`) not technical (`handleClick2`).
- No abbreviations beyond industry standard.
- Inputs and outputs are typed at the boundary; no inferred `any`.
- Control flow is linear: early returns, no nested ternaries, max indent depth 3.
- No reference to global singletons mid-function.
- Side effects are at the edges, not in the middle.
- A new joiner can predict the function's behavior from signature + name alone.

## TypeScript / React strict criteria

- **No `any`** outside `*.test.ts` and adapter shims; prefer `unknown` + narrow.
- **Destructuring depth ≤ 2**.
- **Prop drilling depth ≤ 2**; beyond, compose children or co-locate state.
- **Hook deps**: `react-hooks/exhaustive-deps` is `error`, never disabled without a written justification.
- **Refs**: never read/write during render; never as a substitute for state that affects UI.
- **Discriminated unions over optional fields** — `{ kind: 'ok'; data } | { kind: 'err'; error }` beats `{ data?; error? }`.
- **Branded types** for IDs (`type UserId = number & { __brand: 'UserId' }`).
- **Component size**: ≤150 LOC, ≤4 hooks, ≤2 effects.
- **Props ≤ 7**; beyond, group into a domain object.
- **No default exports** for components/services.
- **Zod/Valibot at every IO boundary**.
- **`readonly` on all DTOs**.

## Automated detection

- **ESLint**: `@typescript-eslint/strict`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-sonarjs`, `eslint-plugin-unicorn`, `eslint-plugin-boundaries`
- **Biome** for fast lint+format
- **knip** / **ts-prune** / **depcheck** for dead exports & deps
- **Prisma Optimize** + `prisma-erd` + slow-query logs for N+1 / missing-index detection
- **SonarQube/Code Climate** for cyclomatic complexity & duplication
- **madge** for circular DI graphs

## Sources

- Martin Fowler — CodeSmell, Refactoring 2e
- Refactoring.Guru — Smell Taxonomy
- React component code smells — Anton Gunnarsson
- 6 Code Smells in React — Reilly
- Prop Drilling is a Code Smell — Tim Williams
- 7 NestJS Architecture Habits That Kill Refactors — Nexumo
- NestJS Anti-Patterns — Thinking Loop
- 10 NestJS Practices to Avoid at Scale
- Prisma Query Optimization (official docs)
- TypeScript Narrowing & Discriminated Unions (official handbook)
- Total TypeScript — Unions, Literals, Narrowing
