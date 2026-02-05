# GitHub–Jira Integration

**Purpose:** Ensure PRs, branches, and commits appear in Jira’s Development panel.

---

## 0. Push via workspace (obrigatório)

**GitHub Actions só disparam quando o push é feito a partir do `gaqno-development-workspace`.**  
Ver [WORKSPACE-WORKFLOW.md](./WORKSPACE-WORKFLOW.md).

---

## 1. Confirm integration

1. In Jira: **Apps** → **Manage your apps** → **GitHub for Atlassian**
2. Check that your GitHub org is listed and connected
3. Open any issue (e.g. KAN-32) and look for the **Development** panel

---

## 2. Setup (if not connected)

1. **Apps** → **Explore more apps** → search **GitHub for Atlassian** → **Get app**
2. **Get started** → **GitHub Cloud** → sign in to GitHub
3. Select the org (e.g. `gaqno`) → **Connect**
4. Choose **All repositories** or **Only select repositories**
5. **Install** and complete the flow

---

## 3. Link development info to issues

Include the Jira key in:

| Action         | Example                                             |
| -------------- | --------------------------------------------------- |
| Branch name    | `feature/KAN-32-migrate-finance-ui-api-client`      |
| Commit message | `KAN-32 Add createAxiosClient usage`                |
| PR title       | `KAN-32 Migrate finance-ui to frontcore API client` |

After pushing, the Development panel on the issue will show branches, commits, and PRs.

---

## 4. References

- [Connect GitHub Cloud to Jira](https://support.atlassian.com/jira-cloud-administration/docs/integrate-with-github/)
- [Link GitHub development information to Jira work items](https://support.atlassian.com/jira-cloud-administration/docs/use-the-github-for-jira-app/)
