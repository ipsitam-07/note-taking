# AGENTS.md

Single source of truth for AI tools on this repo. Update when stack/conventions change.

## 1. Project Overview

Note Taking Application (project code: `textAB`). Authenticated users create, organize, search, share, and manage notes with version history. Includes tag management, full-text search, public read-only sharing, autosave, soft delete, and version restore. No real-time collab, no file uploads, no OAuth, no mobile apps.

## 2. Repository Structure

```
apps/
  api/              Express 5 backend (REST, Prisma, Postgres)
    prisma/         schema.prisma + migrations
    src/
      config/       env loader (zod-validated)
      lib/          prisma client singleton
      modules/      feature modules: auth, notes, tags, search, sharing, versions
      middleware/   auth, error handlers, rate limit
      utils/        helpers
  web/              React 19 + Vite frontend
    src/
      components/   UI components (incl. shadcn/ui in components/ui)
      pages/        route pages
      layouts/      shell layouts
      routers/      react-router config
      services/     API clients (axios)
      hooks/        React hooks
      store/        Zustand stores
      providers/    React context providers
      lib/          frontend utils
      types/        local types

packages/
  shared/           DTOs, zod schemas, types, constants, API contracts (workspace: @repo/shared)
  ui/               shared React components (workspace: @repo/ui)
  eslint-config/    shared eslint config (@repo/eslint-config)
  typescript-config/ shared tsconfigs (@repo/typescript-config)

docs/               FRS.md, SDS.md (spec source of truth)
openspec/           openspec change tickets
.claude/            Claude Code agents/commands
docker-compose.yml  Postgres 16 (host port 5433 → container 5432)
turbo.json          Turborepo task graph
pnpm-workspace.yaml workspace config
```

## 3. Tech Stack

| Layer       | Tech                                   |
| ----------- | -------------------------------------- |
| Frontend    | React 19 + TypeScript + Vite 8         |
| State       | Zustand 5                              |
| Data fetch  | TanStack Query 5                       |
| Forms       | React Hook Form 7 + @hookform/resolvers |
| Editor      | TipTap 3                               |
| UI          | shadcn/ui + Radix + Tailwind 4         |
| Backend     | Node.js >=18 (target 22) + Express 5   |
| DB          | PostgreSQL 16                          |
| ORM         | Prisma 6.15                            |
| Validation  | Zod 4                                  |
| Auth        | jsonwebtoken 9 + bcrypt 6              |
| Logging     | Pino 10 + pino-pretty                  |
| Testing     | Vitest 4 + Supertest 7 + Playwright    |
| Monorepo    | Turborepo 2 + pnpm 9 workspaces        |
| Lint/Format | ESLint 9 + Prettier 3                  |
| Git hooks   | husky + lint-staged + commitlint (conventional) |

Pin all package versions. Node `>=18`. Package manager `pnpm@9.0.0`.

## 4. Key Commands

Run from repo root unless noted.

```bash
pnpm install                       # install all workspaces
pnpm dev                           # turbo dev (all apps)
pnpm build                         # turbo build
pnpm lint                          # turbo lint
pnpm test                          # turbo test
pnpm format                        # prettier write

docker compose up -d               # start Postgres on host 5433

pnpm --filter api dev              # api only
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate   # prisma migrate dev
pnpm --filter api prisma:studio

pnpm --filter web dev              # web only
```

`apps/api/.env` must contain: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORT`. `DATABASE_URL` host port is `5433` (matches docker-compose).

## 5. Architecture Patterns

- Modular monorepo: Turborepo + pnpm workspaces. Apps in `apps/*`, libs in `packages/*`.
- Layered request flow: `Frontend → REST API (Express) → Prisma → Postgres`.
- Backend organized by feature module under `apps/api/src/modules/{auth,notes,tags,search,sharing,versions}`. Cross-cutting: `middleware/`, `lib/`, `utils/`, `config/`.
- API versioned: base path `/api/v1`. All routes under it.
- Shared contracts (DTOs, zod schemas, types, enums, response shapes, constants) live in `packages/shared`. Never duplicate between web and api — import from `@repo/shared`.
- Frontend state split: server state = TanStack Query, local UI state = Zustand, forms = React Hook Form.
- Editor: TipTap, autosave debounced 2s, save only on change, no concurrent in-flight, retry once, latest-write-wins.

## 6. Coding Standards

- Language: TypeScript strict in all packages.
- Naming: `camelCase` vars/functions, `PascalCase` types/components, `kebab-case` files (except React components → `PascalCase.tsx`).
- Prettier: `semi: true`, `singleQuote: true`, `trailingComma: es5`.
- ESLint via `@repo/eslint-config`. Fix on commit (lint-staged).
- Conventional Commits enforced by commitlint. Format: `type(scope): subject`.
- Validation: Zod schemas in `packages/shared/src/schemas`. Validate every endpoint input.
- Error handling: throw typed errors → central error middleware → standardized error response.
- Logging: Pino structured logs. Never log credentials, password hashes, tokens, or OTP secrets.
- No `any` unless justified. Prefer inferred Zod types via `z.infer`.

## 7. Auth Approach

- Email + password. `bcrypt` hashing, salt rounds = 12.
- JWT pair:
  - Access token: 15 min expiry, sent via `Authorization: Bearer …`.
  - Refresh token: 7 day expiry, persisted in `RefreshToken` table.
- Refresh rotation: each refresh revokes prior refresh token and issues new one. Reject revoked or expired refresh tokens.
- Logout revokes refresh token; access token expires naturally.
- Forgot password: 6-digit OTP, 10 min expiry, hashed in DB, value logged to console only (no email infra). Regeneration invalidates prior OTPs.
- Reset password: valid OTP → set new hash → revoke all refresh tokens → invalidate OTP.
- Protected routes require auth middleware. Authorization check on every user-owned resource. Rate-limit auth endpoints. Share endpoints are read-only and isolated from auth.

## 8. API Design Conventions

- REST. Base path `/api/v1`. Resource-oriented routes (`/notes`, `/notes/:id`, `/notes/:id/versions`, `/tags`, `/search`, `/share/:token`).
- Success response:
  ```json
  { "success": true, "data": {}, "meta": {} }
  ```
- Paginated response:
  ```json
  { "success": true, "data": [], "meta": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 } }
  ```
- Error response:
  ```json
  { "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid payload", "fields": [] } }
  ```
- Status codes: `200` ok, `201` created, `400` validation, `401` unauthorized, `403` forbidden, `404` not found, `410` expired, `422` business rule violation, `500` internal.
- Pagination mandatory on list endpoints. Sorting supported.
- All inputs zod-validated. SQL injection protection via Prisma.

## 9. DB Schema Summary

Postgres 16 + Prisma. Key models (full schema in `apps/api/prisma/schema.prisma`):

- `User` — id, email (unique, indexed), passwordHash, timestamps.
- `Note` — id, userId, title, content, deletedAt (soft delete), timestamps. Indexes: userId, deletedAt.
- `Tag` — id, userId, name, color. Unique `(userId, name)`. User-scoped.
- `NoteTag` — junction `(noteId, tagId)` composite PK.
- `SharedLink` — id, noteId, token (unique, indexed), expiresAt, revokedAt, viewCount (atomic increment).
- `NoteVersion` — id, noteId, version, title, content, createdAt. Immutable snapshots. Indexed by noteId.
- `RefreshToken` — id, userId, token (unique, indexed), expiresAt, revokedAt.

Search: PostgreSQL Full-Text Search over `note.title` + `note.content` with GIN index on `tsvector`. `ts_headline` for highlighting. Ranking: title > exact keyword > recency. Excludes soft-deleted and other users' notes.

## 10. Testing Approach

- Unit tests: Vitest. Cover services, utils, validation. Co-located `*.test.ts` next to source.
- API tests: Supertest + Vitest under `apps/api/`. Cover auth, CRUD, errors, permissions, sharing.
- E2E: Playwright. Cover register, login, create note, search, share, restore version.
- Run: `pnpm test` (root) or `pnpm --filter <pkg> test`.
- Min coverage: 80% on new code. Every spec scenario in FRS needs at least one named test.

## 11. Do NOT Do

- Don't duplicate types/schemas between web and api — use `@repo/shared`.
- Don't hard-delete notes — soft delete only (`deletedAt`).
- Don't expose `passwordHash`, refresh tokens, or OTP values in API responses or logs.
- Don't skip zod validation on endpoint inputs.
- Don't write raw SQL with user input — use Prisma parameterized queries.
- Don't allow write operations on public share endpoints.
- Don't use floating package versions — pin every dependency.
- Don't bypass auth middleware on user-owned resources.
- Don't store OTPs in plaintext — hash before persisting.
- Don't implement features without an approved spec/openspec change.
- Don't commit without conventional-commit format (commitlint blocks it).
- Don't `--no-verify` past husky hooks.
- Don't add features outside FRS scope (real-time collab, file uploads, OAuth, folders, mobile).

## 12. Shared Packages

`@repo/shared` (workspace, no build, imports `./src/index.ts` directly):
```
packages/shared/src/
  schemas/   zod schemas (auth.schema, note.schema)
  dto/       API DTOs (auth.dto, note.dto)
  types/     shared types (api.types: success/paginated/error envelopes)
  constants/ http-status
  index.ts   barrel exports
```
- `@repo/ui` — shared React components (`button.tsx`, `card.tsx`, `code.tsx`).
- `@repo/eslint-config` — `base.js`, `node.js`, `react.js`.
- `@repo/typescript-config` — `base.json`, `node.json`, `react.json`.
