# JiraPlus (monorepo)

Monorepo using npm workspaces for the Next.js frontend and Fastify API.

## Getting started
1. Copy `.env.example` to `.env` and fill values.
2. Install deps: `npm install` (from repo root).
3. Run API dev server: `npm run dev:api`.
4. Run frontend dev server: `npm run dev:frontend`.

### Docker (db + redis + api)
```
docker compose up
```
The `api` service uses the mounted working copy; ensure `npm install` has been run locally first.

## Workspaces
- `frontend/`: Next.js app
- `api/`: Fastify API

## Jira OAuth (local)
- Create a Jira Cloud OAuth 2.0 (3LO) app at https://developer.atlassian.com/console/myapps/create-3lo-app/
- Set redirect to `http://localhost:4000/auth/jira/callback`
- Add scopes: `offline_access read:jira-user read:jira-work read:board-sprint:jira`
- Set `JIRA_CLIENT_ID` and `JIRA_CLIENT_SECRET` in `.env`
- Generate `ENCRYPTION_KEY` for token storage (32-byte base64), e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

## Scripts (root)
- `npm run lint` – lint all workspaces
- `npm run typecheck` – TypeScript checks for all workspaces
- `npm run test` – runs tests if defined in a workspace
- `npm run dev:api` – API dev server (Fastify)
- `npm run dev:frontend` – Next.js dev server

## CI
GitHub Actions workflow runs lint/typecheck on push/PR.
