# Implementation Plan: Admin User Management and Software Licence Management System

Build a production-grade, secure Admin User Management and Software Licence Management System featuring React + TypeScript on the frontend, Node.js + Express + TypeScript + Sequelize ORM on the backend, and MySQL database with full reversible migrations, RBAC (Roles & Permissions), Security Hardening (JWT + HttpOnly cookies, Bcrypt, Rate Limiting), Ed25519 Signed Licence Certificates, Customer Management, Audit Logging, and System Setup workflows.

## Proposed Architecture & Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS / Modern CSS Design + React Router DOM + Axios + Lucide React
- **Backend**: Node.js + Express + TypeScript + Sequelize ORM + MySQL2 + JsonWebToken + Bcrypt + Cookie-Parser + Helmet + Cors + Express-Rate-Limit + TweetNaCl (Ed25519)
- **Database**: MySQL 8.0 / MariaDB with reversible migration scripts and seeders using Sequelize / custom database migration runner.

---

## User Review Required

> [!IMPORTANT]
> - **Backend Migration to Node.js/Express/TypeScript**: The existing project contained legacy PHP backend files in `/backend`. We will construct the full Node.js + Express + TypeScript backend inside `/backend` adhering to clean architecture (Controllers, Services, Repositories, Models, Validators, Routes, Middleware).
> - **Ed25519 Key Generation**: Asymmetric Ed25519 key pairs will be generated automatically on first-time setup and stored securely in `backend/storage/licence/` for signing licence certificates.
> - **Database Migrations & Seeders**: Reversible migrations will be provided and executed via database scripts without using `sequelize.sync()`.

---

## Proposed Changes

### 1. Database Migrations & Models (`/database` & `/backend/src/models`)

- Create reversible migrations in `/database/migrations/`:
  - `001_create_roles_table.sql` / `001_down.sql`
  - `002_create_permissions_table.sql` / `002_down.sql`
  - `003_create_role_permissions_table.sql` / `003_down.sql`
  - `004_create_users_table.sql` / `004_down.sql`
  - `005_create_user_roles_table.sql` / `005_down.sql`
  - `006_create_user_sessions_table.sql` / `006_down.sql`
  - `007_create_password_reset_tokens_table.sql` / `007_down.sql`
  - `008_create_login_attempts_table.sql` / `008_down.sql`
  - `009_create_activity_logs_table.sql` / `009_down.sql`
  - `010_create_application_settings_table.sql` / `010_down.sql`
  - `011_create_customers_table.sql` / `011_down.sql`
  - `012_create_licences_table.sql` / `012_down.sql`
  - `013_create_licence_activations_table.sql` / `013_down.sql`
  - `014_create_licence_audit_logs_table.sql` / `014_down.sql`
- Create TypeScript Sequelize models with relations and soft delete (`deleted_at`).

### 2. Node.js + Express + TypeScript Backend (`/backend`)

- Set up package structure with dependencies: `express`, `sequelize`, `mysql2`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `helmet`, `cors`, `dotenv`, `express-rate-limit`, `zod`, `tweetnacl`.
- **Config & Infrastructure**:
  - Environment configuration (`.env` validation)
  - Database connection pool (Sequelize)
  - Cryptographic keys generator (Ed25519 private/public keypair)
- **Middleware Layer**:
  - `authenticateUser`: Validates Bearer JWT access token & active session in database.
  - `requirePermission(code)` / `requireAnyPermission([...codes])`: Checks user permissions.
  - `requireRole(code)`: Validates role membership.
  - `preventSelfDeletion`: Blocks deleting logged-in user account.
  - `protectSuperAdmin`: Prevents demoting or deleting the final `SUPER_ADMIN`.
  - `rateLimiter`: Protects `/login`, `/first-time-setup`, `/forgot-password`.
- **Services & Repositories**:
  - `AuthService`: Login, refresh token rotation, logout, password resets, first-time setup check.
  - `UserService`: CRUD, status toggling, password reset, session revocation.
  - `RoleService`: System roles protection, permissions assignment, copy permissions.
  - `CustomerService`: CRUD for customer records.
  - `LicenceService`: Licence code generation (`EMS-PRO-XXXX-XXXX-XXXX-XXXX`), SHA-256 key hashing, issue, extend, suspend, reactivate, revoke.
  - `ActivationService`: Activation validation, hardware fingerprinting (SHA-256), activation counter checks, Ed25519 signed JSON certificate issuance.
  - `AuditLogService` & `ActivityLogService`: Secure event logging without secrets.
- **Routes & Controllers**:
  - `/api/auth/*`: Login, logout, refresh-token, me, forgot-password, reset-password, change-password, setup-status, first-time-setup.
  - `/api/admin/users/*`: User management APIs.
  - `/api/admin/roles/*`: Role management & permission assignment.
  - `/api/admin/permissions`: Fetch all modules & permissions.
  - `/api/admin/customers/*`: Customer management APIs.
  - `/api/admin/licences/*`: Licence lifecycle management.
  - `/api/admin/activations/*`: Activation management & deactivation.
  - `/api/admin/audit-logs` & `/api/admin/activity-logs`: Auditing endpoints.
  - `/api/admin/settings`: Application settings APIs.
  - `/api/v1/licences/*`: Public/Client activation (`activate`, `validate`, `deactivate`).

### 3. React + TypeScript Frontend (`/frontend`)

- **State Management & Auth Context**:
  - `AuthContext`: Manages access token, current user, permissions check helper (`hasPermission`, `hasRole`).
  - Axios Interceptors: Automatically attaches Bearer token, handles HTTP 401 with transparent refresh token flow, handles HTTP 403.
- **Navigation & Layout**:
  - `AppLayout`: Modern sidebar, header, user profile menu, breadcrumbs, notification area, mobile responsive menu.
  - Sidebar links dynamically filtered based on user permissions.
- **Guards**:
  - `PublicRoute`: Redirects authenticated users to `/dashboard`.
  - `AuthGuard`: Redirects unauthenticated users to `/login`.
  - `PermissionGuard`: Renders 403 Unauthorized page if user lacks required permission.
  - `FirstTimeSetupGuard`: Redirects to `/first-time-setup` if setup incomplete, or blocks access if already completed.
- **Pages**:
  - `/first-time-setup`: Admin setup form (Full Name, Username, Email, Password, Company, Product).
  - `/login`: Admin login screen with Remember Me, Show/Hide Password, Forgot Password link.
  - `/forgot-password` & `/reset-password`.
  - `/dashboard`: KPI statistics cards, recent licences, recent activations, expiring licences, failed logins, recent activities.
  - `/users` (All Users, Add User, Edit User, User Details, Reset Password, Active Sessions, Activity Logs).
  - `/roles` (All Roles, Add Role, Edit Role, Assign Permissions by module, Copy permissions).
  - `/customers` (All Customers, Add/Edit Customer, Customer Details, Customer Licences & Activations).
  - `/licences` (All Licences, Create Licence with key generation & warning modal, Licence Details, Edit, Expiring, Suspended, Revoked).
  - `/activations` (Active, Deactivated, Blocked installations).
  - `/audit-logs`: System audit logs & user activity logs with search and module filtering.
  - `/settings`: Company profile, product settings, licence settings, password policy, email settings.
  - `/profile`: My Profile, update profile details, change password, view active sessions, revoke session.

---

## Verification Plan

### Automated Verification & Tests
1. **Database Migration Runner**: Run reversible migration commands and verify schema creation and rollback capabilities.
2. **Backend TypeScript Compilation**: Run `tsc --noEmit` in `backend` to ensure strict type checking passes.
3. **Backend Unit & Integration Tests**: Run automated API test suite covering setup, auth, user management, RBAC enforcement, licence hashing, activation, and signed certificate verification.
4. **Frontend TypeScript & Build Verification**: Run `npm run build` in `frontend` to verify zero TypeScript or bundle compilation errors.

### Manual & E2E Verification
1. Verify `/first-time-setup` flow: Setup database with zero admin users -> navigate to `/first-time-setup` -> complete setup -> verify redirection to `/login` -> verify setup route is permanently disabled.
2. Test Login flow & HttpOnly refresh token cookie handling.
3. Test RBAC permission checks: Log in as `LICENCE_ADMIN`, `SUPPORT_ADMIN`, `VIEWER` and verify UI elements and API endpoints restrict unauthorized actions.
4. Test Licence creation and Activation flow: Create licence key -> verify hash stored in DB -> submit activation payload -> verify Ed25519 signed certificate generation and offline grace period check.
