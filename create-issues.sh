#!/usr/bin/env bash
set -euo pipefail

REPO="amitsarvate/jiraPlus"

# Create labels (safe to re-run)
create_label() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" 2>/dev/null || true; }
create_label "type: chore"        "BFD4F2" "Chore/maintenance"
create_label "type: feature"      "C2E0C6" "Feature/work"
create_label "infra"              "0052CC" "Infrastructure/setup"
create_label "frontend"           "5319E7" "Frontend work"
create_label "frontend-auth"      "8963FF" "Frontend auth/connect flow"
create_label "backend"            "0E8A16" "Backend work"
create_label "backend-db"         "5319E7" "Backend DB/schema"
create_label "backend-jira"       "5319E7" "Backend Jira integration"
create_label "backend-sync"       "5319E7" "Backend sync/queues"
create_label "backend-metrics"    "5319E7" "Backend metrics"
create_label "backend-alerts"     "5319E7" "Backend alerts"
create_label "jira"               "0052CC" "Jira app/registration"
create_label "infra-deploy"       "0052CC" "Deployment/staging"
create_label "infra-obs"          "0052CC" "Observability"
create_label "infra-ops"          "0052CC" "Ops/readiness"
create_label "ci"                 "FBCA04" "CI"
create_label "auth"               "F9D0C4" "Auth/RBAC"
create_label "scm"                "5319E7" "SCM integration"
create_label "security"           "E11D21" "Security"
create_label "release"            "0E8A16" "Release/launch"
create_label "milestone: M0"      "1F883D" "M0 setup"
create_label "milestone: M1"      "1F883D" "M1 Jira connect"
create_label "milestone: M2"      "1F883D" "M2 ingestion"
create_label "milestone: M3"      "1F883D" "M3 dashboard"
create_label "milestone: M4"      "1F883D" "M4 trends/sharing"
create_label "milestone: M5"      "1F883D" "M5 SCM"
create_label "milestone: M6"      "1F883D" "M6 alerts/retro"
create_label "milestone: M7"      "1F883D" "M7 hardening"

create_issue() {
  local title="$1"; local body="$2"; shift 2
  gh issue create --repo "$REPO" --title "$title" --body "$body" "$@"
}

# M0
create_issue "M0-01: Initialize repo structure" \
"Set up repo layout (monorepo or /frontend + /api), editorconfig, tsconfig, ESLint/Prettier." \
--label "infra" --label "type: chore" --label "milestone: M0"

create_issue "M0-02: Frontend scaffold" \
"Scaffold Next.js or Vite React with basic layout shell and UI library selection." \
--label "frontend" --label "type: feature" --label "milestone: M0"

create_issue "M0-03: Backend scaffold" \
"Scaffold Fastify/Express TS with healthcheck, pino logging, env loader, and error handler." \
--label "backend" --label "type: feature" --label "milestone: M0"

create_issue "M0-04: Dev infra (Docker Compose)" \
"Docker Compose for API + Postgres + Redis; npm scripts; provide .env.example." \
--label "infra" --label "type: chore" --label "milestone: M0"

create_issue "M0-05: DB layer setup" \
"Configure Prisma/Drizzle; run initial migration; wire migration scripts." \
--label "backend-db" --label "type: feature" --label "milestone: M0"

create_issue "M0-06: CI workflow" \
"Add CI for lint + typecheck + minimal test." \
--label "ci" --label "type: chore" --label "milestone: M0"

# M1
create_issue "M1-01: Register Jira Cloud app" \
"Register Jira app; capture client ID/secret/redirect; document scopes and redirect URI." \
--label "jira" --label "type: chore" --label "milestone: M1"

create_issue "M1-02: Backend Jira OAuth flow" \
"Implement OAuth start/callback, store tokens encrypted, validate scopes." \
--label "backend-jira" --label "type: feature" --label "milestone: M1"

create_issue "M1-03: Frontend Connect Jira button" \
"Add Connect Jira button → redirect → success state with connected board placeholder." \
--label "frontend-auth" --label "type: feature" --label "milestone: M1"

create_issue "M1-04: Staging deploy setup" \
"Deploy frontend + API + managed Postgres/Redis; healthcheck green." \
--label "infra-deploy" --label "type: chore" --label "milestone: M1"

# M2
create_issue "M2-01: Jira client module" \
"Typed Jira client with rate-limit/retry handling." \
--label "backend-jira" --label "type: feature" --label "milestone: M2"

create_issue "M2-02: Core models & migrations" \
"Models/migrations for boards, sprints, issues, issue_history, assignees, jira_connections, sync_jobs." \
--label "backend-db" --label "type: feature" --label "milestone: M2"

create_issue "M2-03: Sync worker (scheduled)" \
"Scheduled sync every 5–10 min to pull boards/sprints/issues; store snapshots/deltas." \
--label "backend-sync" --label "type: feature" --label "milestone: M2"

create_issue "M2-04: Jira webhook receiver" \
"Receive issue update events; verify signature; upsert changes." \
--label "backend-jira" --label "type: feature" --label "milestone: M2"

create_issue "M2-05: Sync observability" \
"Logs/metrics for sync jobs: duration, failures, retries." \
--label "infra-obs" --label "type: chore" --label "milestone: M2"

# M3
create_issue "M3-01: Metrics service API" \
"Compute per-sprint aggregates; expose endpoints for last N sprints." \
--label "backend-metrics" --label "type: feature" --label "milestone: M3"

create_issue "M3-02: Dashboard v1 UI" \
"Velocity, created vs completed %, spillover charts; board/sprint selector with states." \
--label "frontend" --label "type: feature" --label "milestone: M3"

create_issue "M3-03: KPI model and badges" \
"Model/API for KPI thresholds; apply pass/fail badges on metrics." \
--label "backend-metrics" --label "type: feature" --label "milestone: M3"

create_issue "M3-04: Dashboard UX polish" \
"Loading/empty/error states; chart formatting/tooltips; readability pass." \
--label "frontend" --label "type: chore" --label "milestone: M3"

# M4
create_issue "M4-01: Metrics snapshots & queries" \
"Persist metrics snapshots; time-series queries for historical trends." \
--label "backend-metrics" --label "type: feature" --label "milestone: M4"

create_issue "M4-02: Trends UI and export/share" \
"Filters (assignee/label), trend charts, export/share (CSV/JSON/PDF-lite)." \
--label "frontend" --label "type: feature" --label "milestone: M4"

create_issue "M4-03: Access control & sharing" \
"Admin vs viewer enforcement; invite/share flow." \
--label "auth" --label "type: feature" --label "milestone: M4"

# M5
create_issue "M5-01: SCM app registration" \
"Register SCM app (GitHub/GitLab/Bitbucket); OAuth/PAT flow documented." \
--label "scm" --label "type: chore" --label "milestone: M5"

create_issue "M5-02: SCM models & mapping" \
"Models for scm_identities, pull_requests, commits; map Jira users to SCM identities." \
--label "backend-db" --label "type: feature" --label "milestone: M5"

create_issue "M5-03: SCM sync worker" \
"Sync PRs/commits per repo; associate to sprints by dates/branches." \
--label "backend-sync" --label "type: feature" --label "milestone: M5"

create_issue "M5-04: SCM metrics UI" \
"Per-dev PR/commit charts; toggle SCM data." \
--label "frontend" --label "type: feature" --label "milestone: M5"

# M6
create_issue "M6-01: Alert rules & notifier" \
"Alert rules for KPI breach/scope creep; scheduler; email/Slack sender." \
--label "backend-alerts" --label "type: feature" --label "milestone: M6"

create_issue "M6-02: Retro summary generator" \
"Generate sprint retro summary (highlights/anomalies)." \
--label "backend-metrics" --label "type: feature" --label "milestone: M6"

create_issue "M6-03: Alerts & retro UI" \
"Alerts settings, retro view/download, notification prefs." \
--label "frontend" --label "type: feature" --label "milestone: M6"

# M7
create_issue "M7-01: RBAC refinement & audit log" \
"RBAC policies; audit log for admin actions and sync jobs." \
--label "auth" --label "type: feature" --label "milestone: M7"

create_issue "M7-02: Security hardening" \
"Token encryption, rate limits, input validation, CORS locks." \
--label "security" --label "type: chore" --label "milestone: M7"

create_issue "M7-03: Ops readiness" \
"Backups, migration gates, Sentry, metrics dashboards." \
--label "infra-ops" --label "type: chore" --label "milestone: M7"

create_issue "M7-04: Production launch checklist" \
"Final readiness checklist; promote staging to prod." \
--label "release" --label "type: chore" --label "milestone: M7"
