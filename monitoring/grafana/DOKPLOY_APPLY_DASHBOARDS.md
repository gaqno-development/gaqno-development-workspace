# Apply Grafana dashboards in Dokploy (gaqno-grafana)

The **gaqno-grafana** service may have dashboard **provisioning** enabled but **no dashboard JSONs** mounted, so the Front, Backend, DevOps, and DNS droppage dashboards show "Dashboard not found".

## One-time fix (compose + redeploy)

1. In **Dokploy**, open the **gaqno-grafana** project/application.
2. Edit the **Docker Compose** used for the stack.
3. Replace the compose with the content of one of these files from this repo:
   - **Four main dashboards only (~80 KB):** `monitoring/grafana/compose-four-dashboards.yaml`
   - **All six dashboards (~104 KB):** `monitoring/grafana/compose-with-dashboards.yaml`
4. **Save** and **Redeploy** the stack.

After redeploy, Grafana should list dashboards under the **Gaqno** folder, for example:

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
