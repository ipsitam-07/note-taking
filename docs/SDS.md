# Software Design Specification (SDS)

## Note Taking Application

Version: 1.1
Project Code: textAB

---

# 1. System Overview

## 1.1 Architecture Style

The application follows a modular monorepo architecture using Turborepo and pnpm workspaces.

Architecture:

```txt
Frontend (React + Vite)
        ↓
REST API (Express)
        ↓
PostgreSQL + Prisma
```

Shared contracts, schemas, and reusable utilities live inside shared packages.

---

## 1.2 Tech Stack

| Layer            | Technology                      |
| ---------------- | ------------------------------- |
| Frontend         | React 19 + TypeScript + Vite    |
| State Management | Zustand                         |
| Data Fetching    | TanStack Query                  |
| Forms            | React Hook Form                 |
| Editor           | TipTap                          |
| UI               | shadcn/ui                       |
| Backend          | Node.js 22 + Express 5          |
| Database         | PostgreSQL 16                   |
| ORM              | Prisma                          |
| Validation       | Zod                             |
| Logging          | Pino                            |
| Testing          | Vitest + Supertest + Playwright |
| Monorepo         | Turborepo + pnpm workspaces     |

---

# 2. Repository Structure

```txt
apps/
  web/
  api/
    prisma/
      schema.prisma
      migrations/

packages/
  shared/
    src/
      schemas/
      types/
      dto/
      constants/
      utils/

  ui/
  eslint-config/
  typescript-config/

docs/
openspec/

.claude/

turbo.json
pnpm-workspace.yaml
```

---

# 3. Shared Package Ownership

`packages/shared` is the single source of truth for:

* API DTOs
* Zod validation schemas
* Shared TypeScript types
* Shared enums
* Response contracts
* Utility helpers
* Constants

Shared contracts must never be duplicated between frontend and backend.

---

# 4. Frontend Design

## 4.1 State Management

| Concern        | Tool            |
| -------------- | --------------- |
| Server State   | TanStack Query  |
| Local UI State | Zustand         |
| Forms          | React Hook Form |

---

## 4.2 Routing

| Route          | Purpose            |
| -------------- | ------------------ |
| /login         | User login         |
| /register      | User registration  |
| /notes         | Notes listing      |
| /notes/:id     | Note editor        |
| /shared/:token | Public shared note |

---

## 4.3 Editor Design

TipTap shall be used for rich text editing.

Autosave strategy:

* Debounce interval: 2 seconds
* Save only when content changes
* Save only if no request is currently pending
* Autosave only for authenticated users
* Failed autosave retries once
* Latest-write-wins strategy for concurrent saves

---

# 5. Backend Design

## 5.1 Module Structure

```txt
src/
  modules/
    auth/
    notes/
    tags/
    search/
    sharing/
    versions/

  middleware/
  lib/
  utils/
  config/
```

---

## 5.2 API Versioning

All APIs shall be versioned.

Base path:

```txt
/api/v1
```

Examples:

```txt
/api/v1/auth/login
/api/v1/notes
/api/v1/search
```

---

## 5.3 API Response Shape

### Success Response

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid payload",
    "fields": []
  }
}
```

---

# 6. Authentication Design

## 6.1 JWT Strategy

| Token         | Expiry     |
| ------------- | ---------- |
| Access Token  | 15 minutes |
| Refresh Token | 7 days     |

Refresh tokens shall be persisted in database.

---

## 6.2 Refresh Token Rotation

Refresh flow requirements:

* Existing refresh token shall be revoked after refresh
* New refresh token shall be generated
* Revoked refresh tokens must be rejected
* Expired refresh tokens must be rejected

---

## 6.3 Password Security

* bcrypt hashing
* Salt rounds: 12

---

## 6.4 OTP Design

| Property | Value                 |
| -------- | --------------------- |
| Length   | 6 digits              |
| Expiry   | 10 minutes            |
| Storage  | Database hashed value |

OTP values shall only be logged to console.

---

# 7. Database Design

## 7.1 Users Table

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  notes        Note[]
  tags         Tag[]
}
```

---

## 7.2 Notes Table

```prisma
model Note {
  id          String   @id @default(uuid())
  userId      String
  title       String
  content     String
  deletedAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user         User          @relation(fields: [userId], references: [id])
  noteTags     NoteTag[]
  versions     NoteVersion[]
  sharedLinks  SharedLink[]
}
```

---

## 7.3 Tags Table

```prisma
model Tag {
  id         String   @id @default(uuid())
  userId     String
  name       String
  color      String
  createdAt  DateTime @default(now())

  user       User      @relation(fields: [userId], references: [id])
  noteTags   NoteTag[]

  @@unique([userId, name])
}
```

---

## 7.4 NoteTag Junction

```prisma
model NoteTag {
  noteId String
  tagId  String

  note Note @relation(fields: [noteId], references: [id])
  tag  Tag  @relation(fields: [tagId], references: [id])

  @@id([noteId, tagId])
}
```

---

## 7.5 Shared Links

```prisma
model SharedLink {
  id         String   @id @default(uuid())
  noteId     String
  token      String   @unique
  expiresAt  DateTime?
  revokedAt  DateTime?
  viewCount  Int      @default(0)
  createdAt  DateTime @default(now())

  note Note @relation(fields: [noteId], references: [id])
}
```

---

## 7.6 Note Versions

```prisma
model NoteVersion {
  id         String   @id @default(uuid())
  noteId     String
  version    Int
  title      String
  content    String
  createdAt  DateTime @default(now())

  note Note @relation(fields: [noteId], references: [id])
}
```

---

## 7.7 Refresh Tokens

```prisma
model RefreshToken {
  id         String   @id @default(uuid())
  userId     String
  token      String   @unique
  expiresAt  DateTime
  revokedAt  DateTime?
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

---

# 8. Database Indexing

Indexes shall be added for:

* User.email
* Note.userId
* Note.deletedAt
* SharedLink.token
* RefreshToken.token

Search shall use:

```sql
GIN index on PostgreSQL search vector
```

---

# 9. Search Design

## 9.1 Search Strategy

Search shall use PostgreSQL Full-Text Search.

Indexed fields:

* note.title
* note.content

---

## 9.2 Highlighting

PostgreSQL `ts_headline` shall be used for highlighted snippets.

---

## 9.3 Ranking Strategy

Search ranking priority:

1. Title matches
2. Exact keyword matches
3. Recent updates

---

## 9.4 Search Constraints

* Search excludes deleted notes
* Search scoped to authenticated user
* Search supports pagination

---

# 10. Sharing Design

## 10.1 Public Link Strategy

Shared links shall use cryptographically secure random tokens.

Requirements:

* Read-only access
* Expiry support
* Revocation support
* Atomic view count increment

---

# 11. Versioning Design

## 11.1 Snapshot Strategy

Every successful note save creates immutable snapshot.

Snapshot contains:

* Title
* Content
* Version number
* Timestamp

---

## 11.2 Restore Strategy

Restoring a version:

1. Creates new version entry
2. Updates current note state
3. Preserves historical snapshots

---

## 11.3 Retention Strategy

Historical versions older than retention threshold may be purged automatically.

Purge process shall not affect active notes.

---

# 12. Validation Design

All validation schemas shall live in:

```txt
packages/shared/src/schemas
```

Validation library:

* Zod

---

# 13. Error Handling

## 13.1 HTTP Status Codes

| Status | Usage                   |
| ------ | ----------------------- |
| 200    | Success                 |
| 201    | Resource created        |
| 400    | Validation error        |
| 401    | Unauthorized            |
| 403    | Forbidden               |
| 404    | Not found               |
| 410    | Expired resource        |
| 422    | Business rule violation |
| 500    | Internal error          |

---

# 14. Security Considerations

1. Password hashes must never be exposed
2. Public share routes must remain isolated
3. Refresh token rotation required
4. SQL injection protection via Prisma
5. Input validation required on all endpoints
6. Authorization checks required for all user-owned resources
7. Rate limiting required on authentication endpoints
8. Share endpoints must remain read-only

---

# 15. Logging Strategy

Structured logging shall use Pino.

Logging requirements:

* API request logging
* Error logging
* Authentication event logging
* No sensitive credentials in logs

---

# 16. Background Jobs

Background cleanup jobs:

* Expired OTP cleanup
* Expired refresh token cleanup
* Old version purge jobs

---

# 17. Environment Variables

Required environment variables:

```env
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
PORT=
```

---

# 18. Testing Strategy

## 18.1 Unit Tests

Framework:

* Vitest

Coverage:

* Services
* Utilities
* Validation

---

## 18.2 API Tests

Framework:

* Supertest

Coverage:

* Authentication
* CRUD operations
* Error scenarios
* Permissions
* Sharing flows

---

## 18.3 E2E Tests

Framework:

* Playwright

Coverage:

* Registration
* Login
* Create note
* Search note
* Share note
* Restore version

---

# 19. Operational Constraints

1. All package versions must be pinned
2. Shared types must never be duplicated
3. Soft delete required for notes
4. Build/lint/test required after every phase
5. One test per spec scenario mandatory
6. One OpenSpec change per ticket
7. No implementation before approved spec

---

# 20. Future Extensions

Potential future capabilities:

* Real-time collaboration
* File attachments
* AI summarization
* Folder organization
* Offline support
