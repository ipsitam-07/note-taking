@AGENTS.md

# CLAUDE.md

Claude Code-specific operating rules. Project facts (stack, schema, conventions) live in `AGENTS.md`. Do not duplicate.

## Permission Model

Proceed without asking:
- Read-only inspection (read, grep, glob, `ls`, `cat`, `git status`, `git diff`, `git log`).
- Edits to files under `apps/**` and `packages/**` source dirs.
- Lint, format, type-check, test runs.
- `pnpm install` after dependency change.
- `prisma generate`.
- Starting/stopping local dev servers and `docker compose up -d` / `down`.

Ask first (`[y/n]`):
- `git push`, `git push --force`, branch deletion, `git reset --hard`, `git rebase`, `git commit --amend`.
- `prisma migrate dev`, `prisma migrate deploy`, `prisma db push`, `prisma migrate reset`.
- Any `DROP`, `TRUNCATE`, destructive SQL.
- `rm -rf`, deleting >1 file, deleting any `.env` or migration.
- Installing new top-level dependencies or bumping pinned versions.
- Editing `turbo.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `.husky/*`, `commitlint.config.js`, root `package.json`.
- Creating PRs, posting comments, GitHub mutations via `gh`.
- Modifying `docs/FRS.md`, `docs/SDS.md`, `openspec/*`.
- Touching `.env*` files.
- Any command outside the repo working dir.

When unsure: ask.

## Context Management

- Soft budget: ~60k tokens. At ~60k, summarize progress and run `/clear` before continuing.
- Prefer `Agent` (Explore/Investigator) for broad searches — keeps main context lean.
- Don't re-read files already in context.
- Avoid `cat` on large files; use `Read` with offset/limit.
- Don't dump full lockfiles, full migrations, or `node_modules` listings.

## Thinking Depth

- Trivial edits, renames, single-line fixes: no extended thinking.
- Multi-file refactor, schema change, auth logic, security-sensitive code: think hard before editing.
- Architectural decisions, cross-cutting changes touching shared contracts: think harder, write a short plan first, confirm with user.
- Cap thinking. If still stuck after one deep pass, ask the user instead of looping.

## Commit Message Format

Conventional Commits (enforced by commitlint):
```
<type>(<scope>): <subject>

<body — why, not what>
```
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `style`.
- Scopes: `api`, `web`, `shared`, `ui`, `db`, `auth`, `notes`, `tags`, `search`, `sharing`, `versions`, `infra`, `deps`.
- Subject ≤50 chars, imperative, no trailing period.
- Body wraps at 72 chars. Reference openspec ticket if applicable.
- Never `--no-verify`. Fix hook failures, then new commit (don't `--amend` past hook fail).

## Branch Naming

```
<type>/<scope>-<short-kebab-desc>
```
- Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `hotfix`.
- Examples: `feat/auth-refresh-rotation`, `fix/notes-soft-delete-filter`, `chore/deps-prisma-bump`.
- Base off `main`. Working branch: `dev` for shared integration.
- Never push directly to `main`.

## Quality Gates

Run in order before declaring work done. Stop at first failure and fix root cause.

1. `pnpm lint` (or `pnpm --filter <pkg> lint`)
2. `pnpm test` (or filtered) — every changed FRS scenario has a named test.
3. `pnpm build` — full type-check + bundle.
4. For api changes touching schema: `pnpm --filter api prisma:generate` + verify migration applies on clean db (ask before running `migrate dev`).
5. For web changes: load route in browser, verify golden path + at least one edge case.

Don't claim "done" if any gate skipped. State explicitly which gate could not run and why.

## Commands That Need `[y/n]` (Quick Reference)

| Command                               | Reason             |
| ------------------------------------- | ------------------ |
| `git push` / `git push --force`       | Affects remote     |
| `git reset --hard` / `git rebase`     | Destructive        |
| `git commit --amend` (after push)     | Rewrites history   |
| `prisma migrate dev/deploy/reset`     | Mutates schema     |
| `prisma db push`                      | Mutates schema     |
| `rm -rf <path>`                       | Destructive        |
| `pnpm add <pkg>` (new top-level)      | Pins dependency    |
| `gh pr create` / `gh pr merge`        | External mutation  |
| Edit `.env*`                          | Secret surface     |
| Edit `docs/FRS.md` / `docs/SDS.md`    | Spec source        |
| Edit `turbo.json` / workspace config  | Infra              |
| Any DB `DROP` / `TRUNCATE`            | Data loss          |
