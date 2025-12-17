# JiraPlus – Master Plan

## Product vision
- Deliver a live, self-serve Jira performance console for Scrum teams: sprint-level, team-level, and individual-level insights (story points, throughput, PRs/commits, created vs. completed ratios, spillover).
- Persist historical metrics and benchmark them against configurable KPIs/thresholds; surface trends, anomalies, and actionable alerts.
- Provide a shareable, secure web app with a clean UI and a dependable backend that syncs with Jira in near real time and can be hosted publicly.

## Target users & use cases
- Engineering managers, tech leads, Scrum masters needing sprint health and individual contributions.
- Use cases: sprint review prep, mid-sprint health checks, velocity tracking, scope creep detection, PR/commit cadence, SLA to KPIs, retro summaries.

## Core metrics (initial)
- Sprint velocity: story points completed vs. committed; burn-up/burn-down.
- Created vs. completed percentage per sprint (scope change).
- Spillover: stories carried into next sprint.
- Lead/cycle time (if available from Jira statuses).
- PRs per developer per sprint; commits per developer per sprint (via SCM integration).
- Work type mix: bugs vs. features vs. chores (via labels/components).
- WIP per assignee; blocked time (if using status/flag).

## Integrations
- Jira Cloud REST API (sprints, issues, boards; webhooks for changes if available).
- SCM (phase 2): GitHub/GitLab/Bitbucket for PRs/commits; map authors to Jira users via email/aliases.

## High-level architecture
- Frontend: React (Vite or Next.js w/ static+SSR hybrid), TypeScript, UI lib (Chakra or custom minimal), charting (ECharts/Recharts).
- Backend: Node.js (TypeScript), Express/Fastify API; background workers for sync; WebSocket/SSE for live feed; cron/queue (BullMQ/Redis) for scheduled syncs.
- Data: Postgres for core data/KPI configs; Redis for caching/queues; Prisma/Drizzle for schema + migrations.
- Auth: Auth0/Clerk/Supabase auth (JWT/OAuth) with role-based access (admin/viewer); per-tenant Jira credentials (PAT/OAuth).
- Hosting (dev/prod): Fly.io/Render/Vercel (frontend) + managed Postgres/Redis; Dockerized services; environment-per-branch preview optional.
- Observability: structured logging (pino), basic metrics (Prometheus/OpenTelemetry), error tracking (Sentry).

## Data model (draft)
- tenants (orgs), users, roles.
- jira_connections (domain, auth, board ids), sync_jobs (status, timings), webhooks.
- boards, sprints, issues, issue_history (status/points changes), assignees.
- metrics_snapshots (per sprint/board), kpis (definition, threshold), alerts.
- scm_identities, pull_requests, commits (phase 2).

## MVP scope (phase 1)
- Jira OAuth/PAT connect flow for a single board.
- Scheduled sync (every 5–10 min) to pull sprints/issues; store history.
- Metrics dashboard: velocity, created vs. completed %, spillover, basic trend over past N sprints.
- KPI thresholds per metric with pass/fail badges.
- Simple roles: admin (configure), viewer (read).
- Deploy to a live URL (staging) and keep it updated on main.

## Phase 2+
- Multi-board support per tenant; cross-team rollups.
- SCM integration for PRs/commits per dev; mapping identities.
- Alerts/notifications (email/Slack) for KPI breaches or scope creep.
- Retro packs: auto-generated sprint summaries with highlights.
- More charts: lead/cycle time, blockage duration, WIP limits, work-type mix.
- Self-serve onboarding and multi-tenant billing (if needed).

## Development approach (“vibe coding”)
- Work in thin, end-to-end slices: connection flow → minimal sync → minimal dashboard → KPI badges → deploy early.
- Keep the UI playful but clear; prioritize readable charts and “so what” insights over raw tables.
- Bias toward shipping to staging quickly; iterate with real Jira data.
- Maintain a living plan; adjust based on Jira API constraints and team feedback.

## Milestones & checkpoints
- M0: Repo setup (frontend + backend skeletons, Docker, lint/format, CI smoke).
- M1: Jira connect flow and storing credentials securely; healthcheck and staging deploy.
- M2: Data ingestion: pull board/sprint/issues; persist; first metrics computed.
- M3: Dashboard v1: velocity, created vs. completed %, spillover; KPI thresholds.
- M4: Historical trends and export/share; stability pass; staging harden.
- M5: SCM integration (PRs/commits), identity mapping, per-dev view.
- M6: Alerts/notifications and retro summary packs.
- M7: Production hardening (authZ, rate limits, observability, backups) and public launch.

## Environments & ops
- Local: Docker compose for API + Postgres + Redis; `.env.example` for secrets.
- Staging: auto-deploy on main; seeded with test tenant; feature flags for risky changes.
- Prod: manual promotion from staging; migrations gate; backups enabled; alerts wired.

## Security & compliance notes
- Store tokens encrypted at rest; short-lived access tokens where possible.
- Principle of least privilege for Jira scopes; rotate credentials.
- Audit log for admin actions and sync jobs.
- Rate limiting and input validation on APIs; CORS locked to allowed origins.

## Open questions / validation
- Jira instance type: Cloud vs. Server/DC? (OAuth scopes differ.)
- Desired refresh cadence for “live” feed; tolerance for delayed metrics.
- Preferred SCM platform(s) and whether to require SCM in MVP.
- Are KPIs standardized across teams or per-board configurable?
- Any constraints on hosting provider or data residency?

## Definition of success (initial)
- Connect a Jira board, view last 3–5 sprints’ velocity/created-vs-completed/spillover with KPI badges, and keep it updated on staging without manual intervention.
- Latency: new issue changes reflected within 5–10 minutes.
- A manager can export/share a sprint summary and spot scope creep early.
