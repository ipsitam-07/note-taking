@../../AGENTS.md

# apps/web — Frontend Rules

React 19 + Vite + TS. shadcn/ui + Tailwind 4. TanStack Query + Zustand + React Hook Form. TipTap editor.

## Commands

```bash
pnpm --filter web dev              # vite
pnpm --filter web build            # tsc && vite build
pnpm --filter web lint
pnpm --filter web test             # vitest
```

Path alias: `@/*` → `apps/web/src/*` (configured in `vite.config.ts` + `tsconfig.json`).

## Component + State Patterns

- Components: PascalCase files. Co-locate styles via Tailwind classes; use `cn()` helper from `@/lib/utils` for conditional classes.
- shadcn primitives live in `src/components/ui/`. Don't edit generated primitives — wrap in higher-level components.
- Pages = thin shells in `src/pages/`. Compose feature components from `src/components/<feature>/`.
- Routing: react-router-dom v7 in `src/routers/`. Lazy-load route components for code splitting.
- Server state: TanStack Query. One `useQuery`/`useMutation` per server resource. Keys as tuples: `['notes', { page, tag }]`. Invalidate on mutation success.
- Local UI state: Zustand stores in `src/store/`. One store per concern. Selectors prevent re-renders.
- Forms: React Hook Form + `@hookform/resolvers/zod` with schemas from `@repo/shared`. Never re-declare validation on frontend.
- API calls: axios client in `src/services/`. One file per backend module. Return DTOs typed from `@repo/shared`.
- Auth: access token in memory (Zustand), refresh token via httpOnly cookie or service call. Axios interceptor refreshes on 401.
- Editor: TipTap with autosave debounced 2s. Skip save if no diff or request in flight. Retry once on failure.

## Anti-Patterns

- No `useState` for server data — use TanStack Query.
- No `useEffect` for data fetching — use `useQuery`.
- No prop drilling >2 levels — lift to Zustand or context.
- No inline zod schemas — import from `@repo/shared`.
- No duplicated DTO types — import from `@repo/shared`.
- No raw `fetch` — use the configured axios client.
- No `any` on component props — explicit interface/type.
- No business logic in components — move to hooks (`src/hooks/`) or services.
- No mutation of TanStack Query cache directly without invalidation.
- No localStorage for tokens (XSS risk) — memory + httpOnly cookie pattern.
- No CSS files outside Tailwind config + `index.css` globals.
- No new shadcn install without checking `components.json` registry first.
