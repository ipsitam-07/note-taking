@../../AGENTS.md

# packages/shared — Shared Contracts

`@repo/shared`. Single source of truth for cross-app contracts. Imported by `apps/api` and `apps/web` directly from source (no build step). All exports flow through `src/index.ts` barrel.

## What Exists Here

```
src/
  schemas/
    auth.schema.ts     zod schemas: register, login, refresh, forgotPassword, resetPassword
    note.schema.ts     zod schemas: createNote, updateNote, listNotesQuery, tag ops
  dto/
    auth.dto.ts        request/response DTOs derived via z.infer
    note.dto.ts        note + tag DTOs
  types/
    api.types.ts       envelopes: SuccessResponse<T>, PaginatedResponse<T>, ErrorResponse, PaginationMeta
  constants/
    http-status.ts     numeric HTTP status code constants
  index.ts             re-exports everything above
```

Add new top-level folders only for new concern types (e.g. `enums/`, `utils/`). Wire into `src/index.ts`.

## Rule: Never Duplicate

Before declaring any of the following in `apps/api` or `apps/web`, check here first:

- Validation schemas → `schemas/`
- Request/response shapes → `dto/`
- Response envelope types → `types/api.types.ts`
- HTTP status constants → `constants/http-status.ts`
- Shared enums, error codes, regex patterns, magic strings

If it exists here, **import it**. Don't redefine. If it almost fits, extend or generalize here — don't fork.

If you find a duplicate (same shape declared in api and web), pull it up to `packages/shared`, replace both call sites, and delete the originals.

## How to Add New Shared Items

1. Pick the right folder by concern type. Create file in kebab-case (`<resource>.<kind>.ts`, e.g. `tag.schema.ts`, `share.dto.ts`).
2. Define with zod first when validation applies; derive TS types via `z.infer<typeof schema>`. Don't hand-write parallel types.
3. Export named (no default exports) so re-export through barrel is consistent.
4. Add `export * from './<folder>/<file>';` to `src/index.ts`.
5. Consumers import via `import { … } from '@repo/shared'`. Do not deep-import `@repo/shared/src/...`.
6. Run `pnpm --filter api build && pnpm --filter web build` to verify both apps still type-check.
7. If adding a new folder: also add `export * from './<folder>'` line or use a folder-level `index.ts`.

## Anti-Patterns

- No runtime dependencies beyond `zod`. This package stays import-cheap.
- No Node-only APIs (fs, path) — must work in browser bundle.
- No React imports — pure types/schemas only. UI primitives go in `@repo/ui`.
- No default exports.
- No circular deps between `schemas/` and `dto/` (dto depends on schemas, never reverse).
