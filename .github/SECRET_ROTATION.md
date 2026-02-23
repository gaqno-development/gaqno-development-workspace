# Secret rotation after remediation

After removing secrets from tracked files, **rotate every exposed secret** so that values that appeared in git history are no longer valid.

1. **Postgres** – Change the password used in `.cursor/mcp.json` and any `.env`; update all DB instances and local/docker envs.
2. **Coolify** – Regenerate the token; update local/coolify config (e.g. in local `mcp.json`).
3. **Atlassian** – Revoke and create new Jira/Confluence API tokens; update local `.env.jira` and any script that uses them.
4. **OpenAI / DeepSeek (openclaw)** – Regenerate API key; set only in local config (do not commit).
5. **Google (e.g. `.env.bak`)** – Rotate the key if that file was ever committed or pushed.

Do rotation **after** the remediation commit so new values are never committed.

---

## GitHub push protection (organization)

Enable in **GitHub → Organization (or repo) → Settings → Code security and analysis → Secret scanning**:

- **Push protection**: Turn on so supported secrets (e.g. GitHub PAT, many provider patterns) block the push and warn the developer. This prevents many leaks before they reach the repo.
- **Secret scanning**: Keep enabled; consider **Copilot custom patterns** for internal token formats (e.g. Postgres, Coolify) so more leaks are preventable.
- **Scan additional locations**: If you use Issues/Wikis/PRs for sensitive content, enable scanning there where available.
