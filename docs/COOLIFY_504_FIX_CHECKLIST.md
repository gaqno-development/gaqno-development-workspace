# Coolify 504 Gateway Timeout — Fix Checklist

When users see **504** (or Cloudflare **524**) and the message says "the server", the origin is your **Coolify server** (Traefik + containers). Use this checklist in order.

---

## 1. Increase Traefik timeouts (portal / API)

Traefik default **read timeout is 60s**. Cloudflare Free plan allows **120s**. If the origin does not respond within 60s, Traefik returns 504 before Cloudflare.

**In Coolify:**

1. Go to **Servers** → select your server (e.g. localhost) → **Proxy**.
2. Open **Configuration** (or the section where Traefik command/args are set).
3. Add or extend **respondingTimeouts** so the proxy waits at least **90–120 seconds** (match Cloudflare’s 120s):

```yaml
command:
  - "--entrypoints.https.transport.respondingTimeouts.readTimeout=120s"
  - "--entrypoints.https.transport.respondingTimeouts.writeTimeout=120s"
  - "--entrypoints.https.transport.respondingTimeouts.idleTimeout=120s"
  - "--entrypoints.http.transport.respondingTimeouts.readTimeout=120s"
  - "--entrypoints.http.transport.respondingTimeouts.writeTimeout=120s"
  - "--entrypoints.http.transport.respondingTimeouts.idleTimeout=120s"
```

4. Save and apply/restart the proxy if required by the UI.

**Per-service override (optional):** If you only want longer timeouts for the portal, use **Container Labels** on **gaqno-shell-ui** (and MFEs if needed):

```yaml
traefik.http.services.<service-name>.loadbalancer.timeout.read=120s
traefik.http.services.<service-name>.loadbalancer.timeout.write=120s
traefik.http.services.<service-name>.loadbalancer.timeout.idle=120s
```

Replace `<service-name>` with the Traefik service name Coolify assigns (e.g. from the generated labels).

---

## 2. Fix gaqno-shell-ui health (portal)

The shell is the entry for `portal.gaqno.com.br`. If its health is **unknown**, the proxy may still send traffic to a slow container and you get 504.

**In Coolify:**

1. Open **gaqno-shell-ui** (portal shell).
2. **General / Domain**: Ensure **FQDN** is set (e.g. `portal.gaqno.com.br`). If it’s empty, set it and save.
3. **Health Check**:
   - **Path**: `GET /`
   - **Expected**: HTTP 200
   - **Timeout**: increase to **15–20s** if the app is slow under load (default 10s can flip to "unknown").
   - **Start period**: keep or set to **90s** so the container has time to boot.
   - **Retries**: 3–5.
4. **Restart** the application once after changing health check so the new settings apply.
5. Wait a few minutes and confirm status becomes **healthy** (not "unknown").

---

## 3. Avoid custom Docker networks (proxy can’t reach app)

If the shell (or any MFE) uses **custom Docker networks** that the Coolify proxy is not attached to, the proxy may get 504 after some time.

- Prefer **Coolify-managed networks** (no custom `networks:` in the app’s compose that isolate it from the proxy).
- If you must keep custom networks, see [Coolify Gateway Timeout docs](https://docs.coolify.codeon.cn/en/troubleshoot/applications/gateway-timeout): connect the proxy to the app network temporarily with `docker network connect <network-name> coolify-proxy`, or move the app to a Coolify destination.

---

## 4. Cloudflare (optional checks)

- **Caching**: Do **not** cache 5xx for the portal (Cache Rules).
- **HTTP/2 to Origin**: If you see many 520/524, try disabling **Speed → Optimization → HTTP/2 to Origin** once to test.
- **Proxy Read Timeout**: On Free plan it’s fixed at 120s; the fix is to make the **origin** respond within 120s (steps 1–3).

---

## 5. Restart portal shell (quick try)

If the shell is "running:unknown" and you’ve already increased timeouts and fixed health check:

1. In Coolify, open **gaqno-shell-ui**.
2. **Restart** the application.
3. Wait for health to turn **healthy** and test the portal again.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Traefik: set read/write/idle timeouts to **120s** (entrypoints or per-service labels). |
| 2 | Shell: set FQDN, health check path `/`, timeout 15–20s, then restart. |
| 3 | Ensure no custom Docker network isolates the app from `coolify-proxy`. |
| 4 | Cloudflare: no cache for 5xx; optionally disable HTTP/2 to Origin to test. |
| 5 | Restart gaqno-shell-ui and confirm healthy. |

After applying 1 and 2, 504s that were due to "the server" (origin) timing out should decrease or stop, as long as the app responds within 120s.
