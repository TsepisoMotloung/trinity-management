# Trinity Management System Plan

## 1) Purpose
Build a complete management system for a sound/event business to manage equipment, events, clients, staff assignments, finance, maintenance, and accountability from planning to closeout.

The platform will use a separated architecture: one standalone backend server (API) and multiple clients (web app and mobile app).

## 2) Roles and Access Model (Only 2 User Types)

### Admin
Admin handles platform-level and business-critical control, including:
- User management (create, update, deactivate users)
- Role assignment (admin or employee)
- Error log monitoring and resolution workflows
- System configuration and settings
- Full access to inventory, events, finance, maintenance, and reports
- Override actions for exceptional cases (with action logging)

### Employee
Employee handles operational and day-to-day workflows, including:
- Inventory updates (as allowed by workflow)
- Event creation and updates
- Equipment booking and check-in/check-out
- Client updates
- Quote and invoice processing (if allowed by policy)
- Payment recording
- Maintenance updates
- Report viewing based on assigned permissions

### Transparency Rule
- Action Log is visible to all employees and admins for transparency.
- All important actions must be logged with who, when, what changed.

## 3) Authentication and Authorization Plan

### Auth Approach
- Use email + password sign-in with secure session-based authentication.
- Passwords stored as salted hashes (Argon2id preferred, bcrypt acceptable fallback).
- Short-lived access token + rotating refresh token strategy for secure sessions.
- Optional two-factor authentication (2FA) for admins at go-live or shortly after.
- Auth is centralized in the backend server so both web and mobile clients use the same identity and access rules.

### Login and Session Flow
1. User submits email and password.
2. Backend validates credentials and role.
3. System issues:
   - Access token (short TTL, e.g., 15 minutes)
   - Refresh token (longer TTL, e.g., 7–30 days)
4. Token storage strategy by client:
   - Web app: refresh token in secure, httpOnly cookie.
   - Mobile app: refresh token in secure OS keystore/keychain storage.
5. Access token used for API authorization.
6. On expiry, client requests token refresh using its stored refresh token.
7. On logout, refresh token is revoked and session is terminated.

### Security Controls
- Enforce strong password rules (length + complexity + common-password blocklist).
- Account lockout/rate limiting after repeated failed attempts.
- CSRF protection for web cookie-based refresh endpoints.
- TLS everywhere (in transit encryption).
- Secrets managed through environment/secret manager; never hard-coded.
- Device/session tracking for admins (who logged in, where, when).

### Role Enforcement
- Two roles only: `admin` and `employee`.
- Authorization policy enforced server-side on every protected endpoint.
- Admin-only endpoints include: user management, role changes, error log management, system settings.
- Employee endpoints include operations workflows (inventory, events, booking, check-in/out, maintenance, finance actions per policy).
- Action Log read access granted to both roles.

### Audit and Error Governance
- Every login, logout, failed login, password reset, and role change is logged.
- Every admin override action is logged with reason.
- Error logs include severity, module, timestamp, trace ID, and resolution status.
- Admin dashboard includes error triage queue and resolution workflow.

### Password Reset and Account Recovery
- Email-based password reset with one-time, expiring token.
- Reset token invalidated after single use.
- Admin can force password reset for employee accounts.

### Auth Acceptance Criteria
- Unauthorized users cannot access protected APIs.
- Employees cannot access admin-only endpoints.
- Refresh token rotation works and revoked tokens cannot be reused.
- All auth-critical events appear in Action Log and security logs.

## 4) Core Modules and What They Do

1. **Equipment List (Inventory)**  
   Stores all sound equipment (speakers, microphones, mixers, cables, etc.), item IDs, categories, and quantities/units.

2. **Equipment Status**  
   Tracks state: Available, Reserved, In Use, Damaged, Under Repair, Lost.

3. **Check-Out / Check-In**  
   Records what equipment leaves for an event and what returns, including condition and shortages.

4. **Event Management**  
   Stores event details: date/time, event type, venue, client, notes, status.

5. **Equipment Booking**  
   Assigns equipment to events with conflict detection to prevent double booking.

6. **Event Calendar**  
   Calendar view of all events with filters (date, venue, status, client).

7. **Client Details**  
   Stores client profile, contacts, billing details, and event history.

8. **Quotes & Invoices**  
   Generates quotes and invoices for events; tracks document lifecycle.

9. **Payment Tracking**  
   Records payments by method: Cash, Ecocash, Mpesa, EFT; supports partial payments.

10. **Staff Management**  
    Stores technician/employee profiles and event assignments.

11. **Equipment Maintenance**  
    Tracks faults, repairs, servicing, maintenance status, and return-to-service.

12. **Reports**  
    Produces income, equipment usage, payment aging, and missing/damaged reports.

13. **Alerts & Reminders**  
    Sends reminders for upcoming events, overdue returns, repairs, and overdue invoices.

14. **User Access**  
    Enforces the two-role model (admin, employee) and permission boundaries.

15. **History / Action Log**  
    Tracks all key actions and updates; visible to all employees and admins.

16. **Mobile Use (Optional)**  
    Mobile-friendly workflows for event-day updates.

17. **QR / Barcode Scan (Optional)**  
    Fast equipment scanning during check-out/check-in and lookup.

## 5) End-to-End Workflow
1. Create/update client.
2. Create event with date, venue, type, requirements.
3. Prepare quote and send to client.
4. Confirm event and book equipment (auto conflict checks).
5. Assign employees/technicians.
6. Perform check-out before event.
7. Execute event.
8. Perform check-in and reconcile missing/damaged items.
9. Open maintenance tickets for faulty equipment.
10. Generate/send invoice.
11. Record payment(s) until settled.
12. Close event with reconciliation and logs complete.

## 6) Key Business Rules
- Equipment with status Damaged, Under Repair, or Lost cannot be booked.
- Double booking is blocked for overlapping event windows.
- Every critical create/update/delete writes to Action Log.
- Action Log is readable by all employees and admins.
- Only admins can manage users, role changes, and error logs.
- Invoice status updates automatically based on total paid amount.

## 7) High-Level Data Entities
- User
- ActionLog
- ErrorLog
- EquipmentItem
- EquipmentStatusHistory
- Event
- EventEquipmentBooking
- CheckOutTransaction
- CheckInTransaction
- Client
- Quote
- Invoice
- Payment
- StaffAssignment
- MaintenanceTicket
- Alert

## 8) Full Technology Stack (Recommended)

### Architecture Decision
- Use **separate deployables**:
   - Backend API server (single source of business logic)
   - Web frontend client
   - Mobile frontend client (optional in MVP, enabled by same API)
- Keep business rules, permissions, logging, and validation in backend only (not duplicated in clients).
- Expose versioned API endpoints (e.g., `/api/v1/...`) to keep web/mobile compatibility stable.
- Use API contracts (OpenAPI) so web and mobile teams can work in parallel.

### Frontend
- Web framework: Next.js (React + TypeScript)
- UI: Tailwind CSS + component library (shadcn/ui or similar)
- State/Data: TanStack Query for server state, Zustand for local UI state
- Forms/Validation: React Hook Form + Zod
- Calendar: FullCalendar (or equivalent React calendar library)
- Mobile-first responsive design for event-day operations
- Mobile app: React Native (Expo) consuming the same backend API

### Backend
- Runtime: Node.js LTS
- Framework: NestJS (preferred) or Express with modular architecture
- Language: TypeScript end-to-end
- API: REST (primary) with OpenAPI/Swagger documentation
- Validation: class-validator/Zod at boundary layer
- Background jobs: BullMQ + Redis (alerts/reminders, retries)
- Deployment model: independently deployable server, separate from web/mobile deployments
- Data access: Prisma ORM as the standard data layer

### Database and Storage
- Primary DB: MySQL 8+
- ORM: Prisma (standard choice)
- Schema migrations: Prisma Migrate with versioned migration files in source control
- Query performance: index strategy for booking windows, event dates, and equipment status lookups
- Caching/queues: Redis
- File storage: S3-compatible object storage for quote/invoice PDFs and attachments

### Auth and Security
- Authentication: JWT access token + rotating refresh token
- Password hashing: Argon2id
- Authorization: role-based policy checks (`admin`, `employee`)
- API hardening: Helmet, CORS policy, rate limiting, input validation, CSRF controls
- Token strategy supports both browser and mobile clients with centralized server-side enforcement and per-device refresh-token revocation

### Notifications and Integrations
- Email: SMTP provider (SendGrid/Mailgun/Postmark)
- SMS/WhatsApp (optional): provider integration for reminders
- Payment references: store transaction metadata for Ecocash, Mpesa, EFT reconciliation

### Reporting and Analytics
- SQL-based report queries + materialized views for heavy summaries
- Export formats: PDF and CSV
- Scheduled report generation through background jobs

### Data Modeling and ORM Rules
- All database reads/writes go through Prisma repositories/services (no raw SQL in controllers).
- Use Prisma transactions for check-out/check-in reconciliation, booking allocation, and payment posting.
- Use optimistic concurrency/version checks on high-contention records where needed.
- Allow raw SQL only for complex reporting queries, wrapped in reviewed service methods.

### Observability and Admin Operations
- Application logs: structured JSON logs
- Error tracking: Sentry (or equivalent)
- Metrics: Prometheus + Grafana (or managed alternative)
- Centralized error logs with admin triage dashboard

### Quality and Testing Stack
- Unit/Integration: Vitest or Jest + Supertest
- E2E: Playwright
- API contract checks: OpenAPI validation
- Static checks: ESLint + Prettier + TypeScript strict mode

### Optional Mobile and Scanning Stack
- Mobile path 1: Progressive Web App (recommended first)
- Mobile path 2: React Native app (if offline/advanced device features needed)
- QR/Barcode scanning: camera-based scanner library + generated equipment labels

## 9) Delivery Roadmap

### Phase 0: Discovery and Setup (Week 1)
- Confirm detailed workflow and policy decisions.
- Finalize fields, statuses, and approval flows.
- Set up environments, CI/CD baseline, backups, monitoring.
- Define API contract-first workflow for server/web/mobile collaboration.
- Set up MySQL environments and baseline Prisma schema/migration pipeline.

### Phase 1: Core Operations (Weeks 2–4)
- Build Equipment List, Equipment Status, Event Management, Client Details.
- Build Equipment Booking conflict detection.
- Build Event Calendar.
- Implement authentication and two-role access model.
- Implement versioned backend API foundation for multi-client consumption.

### Phase 2: Event Execution (Weeks 5–6)
- Build Check-Out / Check-In workflows.
- Add reconciliation for missing/damaged returns.
- Add status transitions and action log coverage.

### Phase 3: Commercials (Weeks 7–8)
- Build Quotes & Invoices.
- Build Payment Tracking (Cash, Ecocash, Mpesa, EFT).
- Add finance and aging reports.

### Phase 4: Maintenance, Reporting, Governance (Weeks 9–10)
- Build Equipment Maintenance workflow.
- Build operations and management reports.
- Build admin tools for user management and error logs.
- Expand alerts and reminders.

### Phase 5: UAT and Go-Live (Weeks 11–12)
- End-to-end testing and bug fixes.
- User training (admin + employee).
- Data import validation and production rollout.

### Phase 6: Optional Enhancements (Weeks 13–16)
- Mobile optimization.
- QR/barcode scanning.
- Advanced dashboards and automation.
- Deliver native mobile app screens on top of existing backend API.

## 10) Testing Strategy
- Unit tests: booking conflict logic, status transitions, payment calculations.
- Integration tests: event-to-payment lifecycle.
- Permission tests: admin-only user/error-log operations.
- Audit tests: action log creation and visibility for all employees.
- UAT with real operational scenarios.

## 11) Risks and Mitigations
- **Data quality risk:** enforce import templates and validation.
- **Operational errors on event day:** streamline check-out/check-in UI and reminders.
- **Permission misuse:** strict admin-only controls for user and error-log management.
- **Transparency gaps:** mandatory action logging and broad visibility.

## 12) Go-Live Acceptance Criteria
- All core modules (1–15) operational.
- Two-role model fully enforced (admin, employee).
- Admin can manage users and error logs.
- Action Log is visible to all employees and admins.
- No critical defects in booking, check-in/out, invoicing, and payments.
- Reports and audit outputs validated against sample operational data.
