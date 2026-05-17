@../../AGENTS.md

# apps/api — Backend Rules

Express 5 + Prisma + Postgres. Module layout under `src/modules/{auth,notes,tags,search,sharing,versions}`.

## Commands

```bash
pnpm --filter api dev              # tsx watch src/index.ts
pnpm --filter api build            # tsc
pnpm --filter api start            # node dist/index.js
pnpm --filter api lint
pnpm --filter api test             # vitest
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate   # prisma migrate dev — ASK FIRST
pnpm --filter api prisma:studio
docker compose up -d               # Postgres on host 5433
```

`.env` keys: `DATABASE_URL`, `PORT`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`. `DATABASE_URL` host port `5433`.

## Framework Patterns

- Module = `routes.ts` + `controller.ts` + `service.ts` + `repository.ts` (or prisma calls inline) + `*.test.ts`.
- Routes mount under `/api/v1/<resource>`. Wire in central `src/app.ts` (or `index.ts`).
- Validate inputs with zod schemas imported from `@repo/shared`. Use `req.body`/`req.params`/`req.query` parsed via schema.
- Auth: `requireAuth` middleware decodes JWT, attaches `req.user`. Apply per-router, not globally (public share routes bypass).
- Authorization: every user-scoped query filters by `userId = req.user.id`. Never trust client-supplied user id.
- Errors: throw `AppError` (or typed subclass) → central error middleware → standard envelope from `@repo/shared`.
- Logging: pino logger from `src/lib/logger.ts`. Log structured fields; never log passwords, tokens, OTPs.
- Prisma client: singleton from `src/lib/prisma.ts`. Don't `new PrismaClient()` per request.
- Response shape always `{ success, data, meta }` or `{ success: false, error }`. Use helper from `@repo/shared`.

## Anti-Patterns

- No hard delete on `Note` — set `deletedAt`. List queries filter `deletedAt: null`.
- No raw SQL with template strings — `prisma.$queryRaw` only with `Prisma.sql` tag.
- No `passwordHash`, refresh token value, or OTP in any response payload.
- No business logic in controllers — keep in `service.ts`.
- No `any` on Express `req`/`res` — extend Request type for `req.user`.
- No new dependency without pinning exact version + asking user.
- No `process.env.X` outside `src/config/env.ts` — import from `env`.
- No `console.log` in shipping code — use pino logger.
- No write endpoints on `/share/:token` — public routes are read-only.
- No global `app.use(requireAuth)` — share + auth routes must remain public.
