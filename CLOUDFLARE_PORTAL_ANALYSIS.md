# Cloudflare configuration analysis: portal.gaqno.com.br stalling and Host Error

This document summarizes findings from Cloudflare docs and zone data (via MCP) for the zone **gaqno.com.br**, to help diagnose portal stalling and "Host Error" when the server has sufficient CPU/RAM.

## Zone summary (from MCP)

| Field | Value |
|-------|--------|
| Zone | gaqno.com.br |
| Zone ID | d628a8ac60069acccbc154d173b88717 |
| Plan | **Free Website** |
| Status | active |
| Name servers | lennox.ns.cloudflare.com, magali.ns.cloudflare.com |
| Page Rule quota | 3 |

## How Cloudflare fits in the path

Traffic to `portal.gaqno.com.br` (and `api.gaqno.com.br`, `grafana.gaqno.com.br`, etc.) is likely:

1. **Client** → **Cloudflare** (proxy, if DNS is “proxied” / orange cloud)
2. **Cloudflare** → **Origin** (Coolify server: Traefik → shell/MFE containers)

If the DNS record for `portal` is **proxied**, then:

- Cloudflare applies **connection limits**, **cache**, and **SSL** between client and origin.
- A **502** seen in the browser can be either:
  - **From origin**: Coolify/Traefik returns 502 (e.g. admin MFE container down) and Cloudflare passes it through.
  - **From Cloudflare**: Cloudflare cannot get a valid response from the origin and returns its own 502/504/52x (see below).

Docs state that a **502/504 from Cloudflare** appears as a **blank page without Cloudflare branding**. A **502/504 from your origin** is passed through and may show your origin’s or browser’s error page. “Host Error” is **not** a standard Cloudflare message in the docs; it may come from the browser, your shell error UI, or another layer.

## Cloudflare connection limits (relevant to stalling)

From [Connection limits](https://developers.cloudflare.com/fundamentals/reference/connection-limits/):

| Limit | Value | When hit | Configurable (Free) |
|--------|--------|----------|----------------------|
| **Proxy Read Timeout** | **120 s** | Origin does not send response in time → **524** | **No** (Enterprise only) |
| Proxy Write Timeout | 30 s | Write to origin does not complete → 524 | No |
| TCP ACK Timeout | 90 s | Origin does not ACK request → **522** | No |
| Complete TCP Connection | 19 s | No SYN+ACK from origin → 522 | No |
| TCP Keep-Alive Interval | 30 s | → 520 | No |

Implications:

- On **Free**, you **cannot** increase Proxy Read Timeout (120 s). If the origin (e.g. Coolify/Traefik or an MFE container) is slow to respond (e.g. cold start, overload), Cloudflare will close the connection and return **524** after 120 s.
- If the origin is **down** or **refuses** the connection, you get **521** (refused) or **522** (timeout). If the origin returns an invalid/empty response, you get **520**.
- So: **502** in the browser is more likely from the **origin** (Traefik → upstream down) than from Cloudflare. Cloudflare timeouts usually show as **522** or **524**.

## Possible Cloudflare config mismatches

### 1. Cache and SPA / Module Federation

- **Risk**: If Cloudflare **caches** HTML or `remoteEntry.js` (or other MFE assets), users can get stale or wrong content. Caching a **502** response would make the error persist.
- **Docs**: Cache Rules can “Bypass cache for everything” or target by file extension / path. For a dynamic portal and MFEs, bypassing cache for `portal.gaqno.com.br` (or at least for `/*/assets/*` and HTML) is often recommended.
- **Check**: In **Caching > Cache Rules** (or Page Rules on Free), ensure no rule is caching HTML or `*.js` for the portal in a way that could serve 502 or old bundles.

### 2. HTTP/2 to Origin

- **Docs**: “If your origin does not support multiplexing, enabling HTTP/2 to origin may result in 5xx errors, **particularly 520s**.”
- **Risk**: If Coolify/Traefik (or the app) does not handle HTTP/2 from Cloudflare correctly, you can see 520 or unstable connections.
- **Check**: In **Speed > Optimization > Protocol Optimization**, try **disabling HTTP/2 to Origin** for the zone and see if 5xx or stalling decrease.

### 3. SSL/TLS mode

- **Docs**: With **Full** or **Full (Strict)**, the origin must listen on **443** and present a valid certificate (for Strict, it must be trusted or the Cloudflare Origin CA).
- **Risk**: Wrong mode or origin cert issues → **525** (SSL handshake failed) or connection failures.
- **Check**: **SSL/TLS** for the zone: use **Full** or **Full (Strict)** and ensure the Coolify server has a correct certificate and listens on 443.

### 4. Cloudflare IPs blocked at origin

- **Docs**: **521** occurs when the origin **refuses** connections from Cloudflare. Common cause: firewall or security software blocking [Cloudflare IP ranges](https://www.cloudflare.com/ips/).
- **Check**: On the Coolify server (or any firewall in front of it), ensure **Cloudflare IPs** are **not** blocked or rate-limited.

### 5. Proxy status (orange vs grey cloud)

- **Proxied (orange)**: Traffic goes through Cloudflare (cache, limits, SSL, DDoS protection). All limits and behaviors above apply.
- **DNS-only (grey)**: Traffic goes directly to the origin; Cloudflare only resolves DNS. No Cloudflare timeouts or cache, but also no Cloudflare protection.
- If you see **522/524** only when the record is proxied, the issue is between Cloudflare and origin (slow/down). If you want to **test** without Cloudflare in the path, set the record to DNS-only temporarily (not recommended for production).

### 6. Development Mode

- Zone data shows `development_mode: -11882` (negative). In the dashboard, **Development Mode** bypasses cache for 3 hours when enabled. Disabled = normal caching.
- If you recently had it on and turned it off, cache behavior will change; ensure Cache Rules still match your intended behavior for the portal.

## 502 on admin remoteEntry.js (from your errors)

You reported:

`GET https://portal.gaqno.com.br/admin/assets/remoteEntry.js net::ERR_ABORTED 502 (Bad Gateway)`

- A **502** here usually means the **origin** (Coolify/Traefik) returned 502 because the **admin MFE** upstream is down or unreachable. Cloudflare is just proxying that response.
- So the main fix is on the **Coolify/proxy** side: ensure **admin-ui** (and every MFE) is deployed, healthy, and that the proxy routes `/admin` (and `/admin/assets/*`) to the correct container with adequate timeouts (see COOLIFY_DEPLOYMENT_CHECKLIST.md).
- Cloudflare can still make things worse if, for example, it **caches** that 502. So ensure no Cache Rule is caching 5xx or `/admin/assets/*` in a way that could serve a cached 502.

## Recommended checks in Cloudflare Dashboard

1. **DNS**: Confirm `portal.gaqno.com.br` (and `api`, `grafana`, etc.) are set as intended (proxied vs DNS-only).
2. **SSL/TLS**: Mode **Full** or **Full (Strict)**; origin certificate valid and bound to 443.
3. **Caching**: Cache Rules (or Page Rules) – bypass cache for the portal host or for `/*/assets/*` and HTML so MFE assets and shell are not over-cached or 502 cached.
4. **Speed > Optimization**: Try disabling **HTTP/2 to Origin** if you see 520 or odd 5xx.
5. **Origin**: Ensure [Cloudflare IPs](https://www.cloudflare.com/ips/) are allowed on the Coolify server/firewall.

## Summary

| Issue | Likely cause | Where to fix |
|-------|--------------|--------------|
| **502 on remoteEntry.js** | Origin (Coolify) upstream down or misrouted | Coolify: deploy admin-ui, check routes and health checks |
| **Stalling / blank load** | Origin slow (cold start, overload) or Cloudflare 524 (120 s timeout) | Origin performance; on Free plan you cannot increase 120 s in Cloudflare |
| **“Host Error”** | Not a Cloudflare term; could be browser or your app | Shell error boundary / network tab to see actual status code and response |
| **520 / 521 / 522** | Origin invalid response, refused connection, or timeout to origin | SSL/origin config; allow Cloudflare IPs; optional: disable HTTP/2 to Origin |
| **Cached 502 or stale MFE** | Cache Rule or Page Rule caching 5xx or assets | Cache Rules: bypass or do not cache for portal/MFE paths |

Using MCP, the zone **gaqno.com.br** was confirmed (plan: Free Website). DNS settings API returned 404 for the tool used, so proxy status and Cache Rules must be checked directly in the [Cloudflare Dashboard](https://dash.cloudflare.com) for the zone.

---

## Applied in this repo (origin-side)

These changes are already in the codebase or were applied so Cloudflare (and any proxy) does not cache content that should stay fresh:

| What | Where | Effect |
|------|--------|--------|
| **Shell `index.html`** | [gaqno-shell-ui/nginx.conf](gaqno-shell-ui/nginx.conf) | `Cache-Control: no-store, no-cache, must-revalidate` so the shell HTML is not cached; reduces risk of stale or cached error pages. |
| **MFE `remoteEntry.js`** | gaqno-admin-ui, gaqno-crm-ui, gaqno-omnichannel-ui (and other MFE) Dockerfiles | Each MFE nginx serves `remoteEntry.js` with `Cache-Control: no-cache`, so proxies (including Cloudflare) are less likely to cache 502 or old entry. |

You still need to apply the Cloudflare Dashboard steps below; the repo cannot change Cloudflare settings.

---

## Checklist: apply these in Cloudflare Dashboard

Do these in [Cloudflare Dashboard](https://dash.cloudflare.com) → select zone **gaqno.com.br**.

1. **Cache Rules (or Page Rules)**  
   - Go to **Caching** → **Cache Rules** (or **Page Rules** on Free).  
   - Add a rule so requests to `portal.gaqno.com.br` (or to `*.gaqno.com.br` if you prefer) **bypass cache**, or at least:  
     - **When**: Hostname equals `portal.gaqno.com.br` (or URL matches `portal.gaqno.com.br/*`).  
     - **Then**: **Bypass cache**.  
   - This avoids Cloudflare caching HTML, `remoteEntry.js`, or 502 responses for the portal.

2. **HTTP/2 to Origin**  
   - Go to **Speed** → **Optimization** → **Protocol Optimization**.  
   - If you see 520 or odd 5xx, set **HTTP/2 to Origin** to **Off** and save. Test for a few hours.

3. **SSL/TLS**  
   - Go to **SSL/TLS**.  
   - Set encryption mode to **Full** or **Full (Strict)**.  
   - Ensure your Coolify origin listens on 443 and has a valid certificate (for Strict: Cloudflare Origin CA or a trusted cert).

4. **Cloudflare IPs at origin**  
   - On the Coolify server (or any firewall in front of it), ensure [Cloudflare IP ranges](https://www.cloudflare.com/ips/) are **not** blocked.  
   - This prevents 521 (connection refused).

5. **DNS proxy status**  
   - In **DNS** → **Records**, check that `portal`, `api`, `grafana`, etc. have the intended proxy status (orange = proxied, grey = DNS-only). Proxied is normal for production.
