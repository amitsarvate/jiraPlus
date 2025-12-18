# JiraPlus – Tracked Issues Backlog

Status: unchecked = not started, [ ]/[/] can be updated as we work. Use these as GitHub issue titles/descriptions (labels in parentheses).

## M0: Repo setup
- [x] M0-01: Initialize repo structure (monorepo or /frontend + /api); add editorconfig, tsconfig, ESLint/Prettier (type: chore, label: infra)
- [x] M0-02: Frontend scaffold (Next.js or Vite React) with basic layout shell and UI lib choice (type: feature, label: frontend)
- [x] M0-03: Backend scaffold (Fastify/Express TS) with healthcheck, logging, env loader, error handler (type: feature, label: backend)
- [x] M0-04: Dev infra: Docker Compose (api, Postgres, Redis), npm scripts, `.env.example` (type: chore, label: infra)
- [x] M0-05: DB layer setup (Prisma/Drizzle) and first migration (type: feature, label: backend-db)
- [x] M0-06: CI workflow for lint + typecheck + minimal test (type: chore, label: ci)

## M1: Jira connect flow + staging deploy
- [x] M1-01: Register Jira Cloud app and document client ID/secret/redirect (type: chore, label: jira)
- [x] M1-02: Backend OAuth endpoints (start/callback) with token storage (encrypted) and scope validation (type: feature, label: backend-jira)
- [x] M1-03: Frontend “Connect Jira” button → redirect → success state (type: feature, label: frontend-auth)
- [ ] M1-04: Staging deploy setup (frontend + api + managed Postgres/Redis) and healthcheck (type: chore, label: infra-deploy) — deferred to later milestone

## M2: Data ingestion (boards/sprints/issues)
- [ ] M2-01: Jira client module with rate-limit/retry handling (type: feature, label: backend-jira)
- [ ] M2-02: Models/migrations for boards, sprints, issues, issue_history, assignees, jira_connections, sync_jobs (type: feature, label: backend-db)
- [ ] M2-03: Sync worker scheduled job (5–10 min) to pull data and store snapshots/deltas (type: feature, label: backend-sync)
- [ ] M2-04: Webhook receiver for issue updates (verify signature) (type: feature, label: backend-jira)
- [ ] M2-05: Sync observability (logs/metrics for job duration/failures) (type: chore, label: infra-obs)

## M3: Dashboard v1
- [ ] M3-01: Metrics service to compute per-sprint aggregates; API endpoints for last N sprints (type: feature, label: backend-metrics)
- [ ] M3-02: Frontend dashboard: velocity, created vs. completed %, spillover charts; board/sprint selector (type: feature, label: frontend)
- [ ] M3-03: KPI model/API and pass/fail badges applied to metrics (type: feature, label: backend-metrics)
- [ ] M3-04: UX polish: loading/empty/error states; chart formatting (type: chore, label: frontend)

## M4: Historical trends + sharing
- [ ] M4-01: Metrics snapshot persistence and time-series queries (type: feature, label: backend-metrics)
- [ ] M4-02: Filters (assignee/label) and trends UI; export/share (CSV/JSON/PDF-lite) (type: feature, label: frontend)
- [ ] M4-03: Access control: admin vs viewer enforcement; invite/share flow (type: feature, label: auth)

## M5: SCM integration (PRs/commits)
- [ ] M5-01: SCM app registration (GitHub/GitLab/Bitbucket) and OAuth/PAT flow (type: chore, label: scm)
- [ ] M5-02: Models for scm_identities, pull_requests, commits; identity mapping to Jira users (type: feature, label: backend-db)
- [ ] M5-03: Sync worker for PRs/commits per repo; associate to sprints (type: feature, label: backend-sync)
- [ ] M5-04: Frontend per-dev PR/commit charts; toggle SCM data (type: feature, label: frontend)

## M6: Alerts + retro packs
- [ ] M6-01: Alert rules (KPI breach/scope creep) and scheduler; email/Slack sender (type: feature, label: backend-alerts)
- [ ] M6-02: Retro summary generator (sprint highlights) (type: feature, label: backend-metrics)
- [ ] M6-03: Frontend alerts settings; retro summary view/download; notification preferences (type: feature, label: frontend)

## M7: Hardening & launch
- [ ] M7-01: RBAC refinement and audit log for admin actions/sync jobs (type: feature, label: auth)
- [ ] M7-02: Security hardening: token encryption, rate limits, input validation, CORS locks (type: chore, label: security)
- [ ] M7-03: Ops: backups, migration gates, error tracking (Sentry), metrics dashboards (type: chore, label: infra-ops)
- [ ] M7-04: Production readiness checklist and promotion to prod (type: chore, label: release)
- [ ] M7-05: Staging deploy setup (frontend + api + managed Postgres/Redis) and healthcheck (type: chore, label: infra-deploy) — deferred until late development

## How to track
- Use this file as the source of truth and mirror each line as a GitHub issue (labels shown in parentheses). Add assignees/estimates when creating issues.
- Keep status in GitHub; periodically sync back here (or delete this file once issues exist in your tracker).
- Keep branches small: 1–2 items per PR; after merge, move the issue to “Done” and deploy to staging for milestones M1+.
