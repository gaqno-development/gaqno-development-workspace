# Apply Grafana dashboards in Coolify (gaqno-grafana service)

The **gaqno-grafana** Coolify service currently has dashboard **provisioning** enabled but **no dashboard JSONs** mounted, so the Front, Backend, DevOps, and DNS droppage dashboards show "Dashboard not found".

## One-time fix (paste compose and redeploy)

1. In **Coolify**, open the **gaqno-grafana** service (Services → gaqno-grafana).
2. Open the **Docker Compose** (or Compose / Edit) view.
3. Replace the current compose with the content of one of these files from this repo:
   - **Four main dashboards only (~80 KB):** `monitoring/grafana/compose-four-dashboards.yaml`
   - **All six dashboards (~104 KB):** `monitoring/grafana/compose-with-dashboards.yaml`
4. **Save** and **Redeploy** the service (or Restart if your Coolify has that for compose-only changes).

After the redeploy, Grafana will have the dashboards under the **Gaqno** folder and these URLs will work:

- https://grafana.gaqno.com.br/d/gaqno-dashboard-front
- https://grafana.gaqno.com.br/d/gaqno-dashboard-backend
- https://grafana.gaqno.com.br/d/gaqno-dashboard-devops
- https://grafana.gaqno.com.br/d/gaqno-dns-droppage
- https://grafana.gaqno.com.br/d/services-overview (and errors-by-frontend if you used the full compose)

## Regenerating the compose files

From the repo root:

```bash
cd monitoring/grafana
python3 build-compose-with-dashboards.py          # compose-with-dashboards.yaml (all 6)
python3 build-compose-with-dashboards.py --four   # compose-four-dashboards.yaml (4 main)
```
