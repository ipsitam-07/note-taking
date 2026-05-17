# Project Context

## Project Name

Note Taking Application (`textAB`)

---

# Business Context

A full-stack note taking platform where authenticated users can:

- create and manage notes
- organize notes using tags
- search notes using full-text search
- share notes publicly via secure links
- restore historical note versions
- autosave note changes

Out of scope:
- real-time collaboration
- file uploads
- OAuth/social login
- mobile applications
- folders/workspaces

---

# Technical Stack

## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui
- TanStack Query
- Zustand
- React Hook Form
- TipTap

## Backend

- Node.js
- Express 5
- Prisma
- PostgreSQL 16
- Zod
- JWT authentication

## Monorepo

- Turborepo
- pnpm workspaces

---

# Architecture Constraints

- Shared contracts must live in `packages/shared`
- Prisma schema is backend source of truth
- Use strict TypeScript
- Modular backend architecture
- Thin controllers, business logic in services
- REST API under `/api/v1`
- Soft delete required for notes
- Shared public links must remain read-only

---

# API Conventions

## Success Response

```json
{
  "success": true,
  "data": {}
}
```

## Error Response

```json
{
  "success": false,
  "error": {
    "code": "",
    "message": ""
  }
}
```

---

# Database Rules

- PostgreSQL 16
- Prisma ORM
- UUID primary keys
- Indexed foreign keys
- Soft deletes for notes
- Refresh token persistence required

---

# Frontend Conventions

- Server state → TanStack Query
- UI state → Zustand
- Validation → shared Zod schemas
- Forms → React Hook Form
- Components → functional components only

---

# Backend Conventions

- Feature modules under `src/modules`
- Validation on every endpoint
- Prisma-only DB access
- Centralized error handling
- Authorization on all user-owned resources

---

# Quality Gates

Every implementation must pass:

```bash
pnpm build
pnpm lint
pnpm test
```

---

# Workflow

Development lifecycle:

1. /spec
2. /plan
3. /tasks
4. /implement
5. /review
6. /pr

No implementation without approved spec/tasks.