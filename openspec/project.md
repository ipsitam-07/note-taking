# Project Context — Note Taking Application (`textAB`)

This file is the shared context OpenSpec injects when generating proposals, specs, and tasks. Keep aligned with `docs/FRS.md`, `docs/SDS.md`, and root `AGENTS.md` / `CLAUDE.md`.

---

## 1. Product Summary

Note Taking Application. Authenticated users create, organize (tags), search (full-text), share (public read-only links), and version their notes. Includes autosave, soft delete with 30-day recovery, and version restore.

Explicit non-goals: real-time collaboration, file/image uploads, OAuth/social login, folder/nesting, mobile apps, email delivery infrastructure (OTP is console-logged).

User roles: `User` (authenticated) and `Public Viewer` (anonymous, share-link only).

---

## 2. Tech Stack

| Layer            | Tech                                            |
| ---------------- | ----------------------------------------------- |
| Frontend         | React 19 + TypeScript + Vite 8                  |
| State            | Zustand 5 (UI) + TanStack Query 5 (server)      |
| Forms            | React Hook Form 7 + Zod resolvers               |
| Editor           | TipTap 3                                        |
| UI primitives    | shadcn/ui + Radix + Tailwind 4                  |
| Backend          | Node.js (>=18, target 22) + Express 5           |
| Database         | PostgreSQL 16                                   |
| ORM              | Prisma 6.15                                     |
| Validation       | Zod 4                                           |
| Auth             | jsonwebtoken 9 + bcrypt 6 (salt rounds 12)      |
| Logging          | Pino 10 (+ pino-pretty in dev)                  |
| Testing          | Vitest 4 + Supertest 7 + Playwright             |
| Monorepo         | Turborepo 2 + pnpm 9 workspaces                 |
| Lint/Format      | ESLint 9 + Prettier 3                           |
| Git hooks        | husky + lint-staged + commitlint (conventional) |

Package manager pinned to `pnpm@9.0.0`. All deps pinned (no `^` floats for runtime deps).

---

## 3. Architecture

Modular monorepo. Flow:

```
React (apps/web) → REST /api/v1 (apps/api, Express) → Prisma → PostgreSQL
```

Workspaces:

- `apps/api` — backend, feature modules under `src/modules/{auth,notes,tags,search,sharing,versions}`, plus `middleware/`, `lib/`, `utils/`, `config/`.
- `apps/web` — frontend, pages/components/hooks/services/store/routers/providers/layouts/lib.
- `packages/shared` — zod schemas, DTOs, shared types, response envelopes, HTTP status constants. Source-imported, no build step.
- `packages/ui` — shared React primitives.
- `packages/eslint-config`, `packages/typescript-config` — shared configs.

---

## 4. Architectural Constraints

1. **Shared contracts must not be duplicated.** Any zod schema, DTO, response envelope, enum, or HTTP constant lives in `packages/shared`. Frontend and backend import from `@repo/shared`.
2. **API versioning.** All routes under `/api/v1`. Resource-oriented REST.
3. **Standard response envelopes** (defined in `@repo/shared/types/api.types`):
   - Success: `{ success: true, data, meta? }`
   - Paginated: `{ success: true, data: [], meta: { page, limit, total, totalPages } }`
   - Error: `{ success: false, error: { code, message, fields? } }`
4. **Auth model.** JWT pair — access (15 min) + refresh (7 days, persisted in `RefreshToken` table). Refresh rotation mandatory: each refresh revokes the old token. Bcrypt salt rounds = 12.
5. **OTP.** 6 digits, 10 min expiry, hashed in DB, console-logged only.
6. **Soft delete only.** `Note.deletedAt` is the soft-delete marker. List queries filter `deletedAt: null`. 30-day recovery window.
7. **Public share endpoints are read-only.** Isolated from auth middleware. Atomic `viewCount` increment.
8. **Versioning.** Every successful note save creates an immutable `NoteVersion` snapshot. Restore creates a new snapshot — never mutates history.
9. **Search.** PostgreSQL Full-Text Search with GIN index on tsvector. `ts_headline` for highlights. Excludes soft-deleted notes; scoped to the requesting user.
10. **Validation.** Zod schemas live in `packages/shared/src/schemas`. Every endpoint validates input.
11. **Logging.** Pino structured logs. Never log passwords, hashes, tokens, or OTPs.
12. **SQL safety.** Use Prisma parameterized queries. Raw SQL only via `Prisma.sql` tag.
13. **Rate limiting** required on auth endpoints.
14. **Required env.** `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORT`. `DATABASE_URL` host port `5433` (matches `docker-compose.yml`).

---

## 5. Database Models (Prisma)

`User`, `Note`, `Tag`, `NoteTag` (junction), `SharedLink`, `NoteVersion`, `RefreshToken`. Indexes on: `User.email`, `Note.userId`, `Note.deletedAt`, `SharedLink.token`, `RefreshToken.token`, plus GIN on note search vector. Full schema in `apps/api/prisma/schema.prisma`.

---

## 6. Team Conventions

- **OpenSpec discipline.** One OpenSpec change per ticket. No implementation begins before the spec is approved.
- **Conventional Commits** enforced via commitlint. Format: `<type>(<scope>): <subject>`. Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `style`. Scopes: `api`, `web`, `shared`, `ui`, `db`, `auth`, `notes`, `tags`, `search`, `sharing`, `versions`, `infra`, `deps`. Subject ≤50 chars, imperative.
- **Branch names.** `<type>/<scope>-<short-kebab-desc>` (e.g. `feat/auth-refresh-rotation`). Working branch is `dev`; never push direct to `main`.
- **TypeScript strict** across all packages.
- **Naming.** `camelCase` vars/functions, `PascalCase` types/React components, `kebab-case` file names (React components are `PascalCase.tsx`).
- **Prettier.** `semi: true`, `singleQuote: true`, `trailingComma: 'es5'`.
- **No default exports** in `packages/shared`. Named exports only.
- **Types from Zod.** Derive DTOs via `z.infer<typeof schema>`; do not hand-write parallel types.
- **Husky hooks** must never be bypassed (`--no-verify` forbidden). Fix the underlying failure and create a new commit.

---

## 7. Quality Standards

1. **Spec coverage.** Every FRS acceptance criterion → at least one named test.
2. **Coverage floor.** ≥80% on new code.
3. **Test layering.**
   - Unit (Vitest) — services, utils, validation.
   - API (Supertest + Vitest) — auth, CRUD, permissions, error scenarios, sharing.
   - E2E (Playwright) — register, login, create note, search, share, restore version.
4. **Quality gates (in order, before "done"):** `pnpm lint` → `pnpm test` → `pnpm build` → (for api schema changes) `prisma generate` + migration verified on clean DB → (for web) browser smoke of golden path + one edge case.
5. **Performance targets.** API ≤300 ms p-normal-load. Search ≤500 ms. List endpoints paginated.
6. **Security.**
   - Passwords bcrypt-hashed; hashes never exposed.
   - Refresh token rotation required.
   - Authorization check on every user-owned resource (`userId = req.user.id`).
   - Public share routes remain read-only and isolated.
   - Rate-limit auth endpoints.
   - Input validation on every endpoint.
7. **Reliability.** Soft-deleted notes recoverable 30 days. Version history immutable. Share `viewCount` increments atomically.
8. **Operational discipline.** Pin all package versions. Shared types live in `packages/shared` (no duplication). Build/lint/test required after every phase.

---

## 8. Reference Docs

- `docs/FRS.md` — functional requirements (acceptance criteria, error scenarios).
- `docs/SDS.md` — software design (architecture, schemas, strategies).
- `AGENTS.md` — repo-wide AI context.
- `CLAUDE.md` (root + per-app) — Claude Code operating rules.
