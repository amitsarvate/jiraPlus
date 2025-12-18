# Agent runbook

- When you finish a task, update both `issues.md` and the corresponding GitHub issue (using `gh issue comment/close`) if network/auth is available. If not, note it in your update to the user.
- Keep `issues.md` as a mirror of status for offline tracking.
- Use small, end-to-end slices; open PRs per slice; ensure lint/typecheck run in CI.
- For every code change, add unit tests covering the change and run all newly added tests locally; report results in the final update.
- After each completed issue, add a concise change note in `change-notes/<Milestone>/<Issue>.md` (or create the folder/file if missing).
- Troubleshooting Jira OAuth/crypto:
  - Ensure `ENCRYPTION_KEY` is set in the root `.env`; encryption helper reads it at call time. If you see “ENCRYPTION_KEY not set,” restart the API after confirming `.env`.
  - Server loads env from root paths; keep `.env` at repo root. Restart dev server to pick up changes.
  - Before OAuth tests, ensure Prisma migrations are applied and the client generated; DB errors can surface as callback failures.
- If you roll back deployment scaffolding, update `issues.md` and remove related files (Dockerfiles/fly config/change-notes) to reflect current plan.
