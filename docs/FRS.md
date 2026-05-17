# Functional Requirements Specification (FRS)

## Note Taking Application

Version: 1.0
Project Code: textAB

---

# 1. Introduction

## 1.1 Purpose

The purpose of this document is to define the functional requirements for the Note Taking Application. The application enables authenticated users to create, organize, search, share, and manage notes with version history support.

This document defines WHAT the system must do.

---

## 1.2 Scope

The system provides:

* User authentication and session management
* Note creation and editing
* Tag management
* Full-text search
* Public note sharing
* Version history and restoration
* Autosave support
* Soft deletion and recovery support

The system does NOT provide:

* Real-time collaboration
* File uploads
* Mobile applications
* OAuth/social login
* Nested note structures
* Email delivery infrastructure

---

# 2. User Roles

| Role          | Description                           |
| ------------- | ------------------------------------- |
| User          | Authenticated application user        |
| Public Viewer | Anonymous user accessing shared notes |

---

# 3. Functional Requirements

# 3.1 Authentication

## 3.1.1 User Registration

### Description

Users shall be able to create an account using email and password.

### Acceptance Criteria

1. User can register with unique email.
2. Password must meet validation rules.
3. Registration returns access token and refresh token.
4. Duplicate email returns validation error.
5. Password shall be hashed before persistence.

### Validation Rules

* Email must be valid format.
* Password minimum length: 8 characters.
* Password must contain:

  * One uppercase letter
  * One lowercase letter
  * One number

### Error Scenarios

| Scenario        | Expected Result |
| --------------- | --------------- |
| Duplicate email | HTTP 422        |
| Invalid email   | HTTP 400        |
| Weak password   | HTTP 400        |

---

## 3.1.2 User Login

### Description

Users shall authenticate using email and password.

### Acceptance Criteria

1. Valid credentials return access token.
2. Refresh token shall be issued.
3. Invalid credentials return authentication error.
4. Refresh token shall be stored in database.

### Error Scenarios

| Scenario            | Expected Result |
| ------------------- | --------------- |
| Invalid password    | HTTP 401        |
| User not found      | HTTP 401        |
| Missing credentials | HTTP 400        |

---

## 3.1.3 Logout

### Description

Users shall be able to terminate active sessions.

### Acceptance Criteria

1. Refresh token shall be revoked.
2. Access token becomes unusable after expiry.
3. User can logout from current session.

---

## 3.1.4 Forgot Password

### Description

Users shall request a password reset OTP.

### Acceptance Criteria

1. OTP shall be generated.
2. OTP validity: 10 minutes.
3. OTP shall be logged to console.
4. Existing OTPs become invalid after regeneration.

### Error Scenarios

| Scenario      | Expected Result |
| ------------- | --------------- |
| Invalid email | HTTP 404        |
| Expired OTP   | HTTP 410        |
| Invalid OTP   | HTTP 400        |

---

## 3.1.5 Reset Password

### Acceptance Criteria

1. Valid OTP resets password.
2. Existing refresh tokens shall be revoked.
3. Password must satisfy validation rules.
4. OTP becomes invalid after successful use.

---

# 3.2 Notes Management

## 3.2.1 Create Note

### Description

Users shall create notes.

### Acceptance Criteria

1. User can create note with title and content.
2. Note ownership shall be enforced.
3. Empty content notes are allowed.
4. Autosave support shall persist changes.
5. Note version snapshot shall be created.

### Error Scenarios

| Scenario             | Expected Result |
| -------------------- | --------------- |
| Unauthorized request | HTTP 401        |
| Invalid payload      | HTTP 400        |

---

## 3.2.2 View Notes

### Acceptance Criteria

1. Users shall only view owned notes.
2. Notes shall support pagination.
3. Notes shall support sorting.
4. Soft-deleted notes shall not appear by default.
5. Tag filtering shall be supported.

---

## 3.2.3 Update Note

### Acceptance Criteria

1. Users shall update title and content.
2. Every save shall create version snapshot.
3. Updated timestamp shall change.
4. Tag assignments shall update.

---

## 3.2.4 Soft Delete Note

### Acceptance Criteria

1. Notes shall use soft delete only.
2. Deleted notes shall store deletedAt timestamp.
3. Deleted notes remain recoverable for 30 days.
4. Deleted notes shall not appear in default listings.

---

# 3.3 Tags

## 3.3.1 Create Tag

### Acceptance Criteria

1. Users shall create tags.
2. Tags are user-scoped.
3. Tags support color values.
4. Duplicate tag names per user are prohibited.

---

## 3.3.2 View Tags

### Acceptance Criteria

1. Tags shall return note count.
2. Tags shall only show user-owned notes.
3. Tags support sorting by usage count.

---

## 3.3.3 Update/Delete Tag

### Acceptance Criteria

1. Users can rename tags.
2. Users can change tag color.
3. Deleting tag removes note associations.
4. Notes themselves shall remain intact.

---

# 3.4 Search

## 3.4.1 Full Text Search

### Description

Users shall search notes using PostgreSQL full-text search.

### Acceptance Criteria

1. Search shall support title and content.
2. Search results shall return highlighted matches.
3. Search shall support pagination.
4. Search shall ignore soft-deleted notes.
5. Search results shall only include owned notes.

### Error Scenarios

| Scenario             | Expected Result |
| -------------------- | --------------- |
| Empty query          | HTTP 400        |
| Unauthorized request | HTTP 401        |

---

# 3.5 Public Sharing

## 3.5.1 Generate Share Link

### Acceptance Criteria

1. Users shall generate public links.
2. Links shall support expiry.
3. Links shall be read-only.
4. Links shall be unique.
5. Multiple active links per note are allowed.

---

## 3.5.2 Revoke Share Link

### Acceptance Criteria

1. Users shall revoke active links.
2. Revoked links become inaccessible immediately.

---

## 3.5.3 Public Access

### Acceptance Criteria

1. Anonymous users can access shared note.
2. Expired links return access error.
3. View count increments atomically.
4. Public users cannot edit notes.

### Error Scenarios

| Scenario     | Expected Result |
| ------------ | --------------- |
| Expired link | HTTP 410        |
| Invalid link | HTTP 404        |
| Revoked link | HTTP 403        |

---

# 3.6 Version History

## 3.6.1 Snapshot Creation

### Acceptance Criteria

1. Every note save creates snapshot.
2. Snapshot stores title and content.
3. Snapshot stores created timestamp.
4. Snapshot stores version number.

---

## 3.6.2 View Version History

### Acceptance Criteria

1. Users shall view version list.
2. Users shall view historical versions.
3. Versions ordered newest first.
4. Only owner may access versions.

---

## 3.6.3 Restore Version

### Acceptance Criteria

1. Users shall restore old version.
2. Restoration creates new version.
3. Current note content shall update.
4. Historical versions remain immutable.

---

## 3.6.4 Auto Purge

### Acceptance Criteria

1. Versions older than retention period may be purged.
2. Purge process shall not affect active notes.

---

# 4. Non-Functional Requirements

## 4.1 Performance

1. API responses should complete within 300ms under normal load.
2. Search responses should complete within 500ms.
3. Pagination must be implemented for list endpoints.

---

## 4.2 Security

1. Passwords shall be hashed using bcrypt.
2. JWT access token expiry: 15 minutes.
3. Refresh token expiry: 7 days.
4. Refresh tokens stored in database.
5. Protected routes require authentication.
6. Public share endpoints must remain read-only.

---

## 4.3 Reliability

1. Soft-deleted notes must remain recoverable for 30 days.
2. Version history must preserve historical state.
3. Atomic operations required for share view count.

---

## 4.4 Testing

1. Each spec scenario requires at least one named test.
2. New code coverage minimum: 80%.
3. E2E flows required for major user journeys.

---

# 5. Out of Scope

The following capabilities are explicitly excluded:

* Real-time collaborative editing
* Image uploads
* File attachments
* Social login
* Folder hierarchy
* Mobile applications
* Email provider integration

---

# 6. Assumptions

1. Users access the system via modern browsers.
2. PostgreSQL is always available.
3. Email OTPs are console logged only.
4. Single-region deployment.