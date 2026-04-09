#!/usr/bin/env python3
import json
import time
import urllib.request
import urllib.error
import sys

API = "http://72.61.221.19:3000/api/trpc"
KEY = "ScaztGYYFOkIvxByTEkFFqCgOHwWSDvvQCsoFjXEzawJfNqBkkgeKNJiOJADIuTN"

BACKENDS = [
    "sso-service", "ai-service", "crm-service", "erp-service",
    "finance-service", "pdv-service", "rpg-service", "omnichannel-service",
    "wellness-service", "admin-service", "lead-enrichment-service",
    "customer-service", "intelligence-service", "consumer-service",
    "dropshipping-service",
]

FRONTENDS = [
    "shell-ui", "sso-ui", "ai-ui", "crm-ui", "erp-ui", "finance-ui",
    "pdv-ui", "rpg-ui", "omnichannel-ui", "admin-ui", "wellness-ui",
    "intelligence-ui", "landing-ui", "docs-ui", "consumer-ui",
    "dropshipping-ui",
]

APP_IDS = {
    "sso-service": "45wH8Ku5c0D5Rz5lF5zK2",
    "ai-service": "UIBv6z6-2BQ7LlQiigKaL",
    "crm-service": "LWpbnOhnxW66p98OFYaPr",
    "erp-service": "2tJicL4up3TcOqU2PIRgZ",
    "finance-service": "PUwOEkNg3o1T7HABe35PK",
    "pdv-service": "s1fZpwWkBFEIGX7PtH6Su",
    "rpg-service": "M3bjEIuUMk0CEdQvhe3SL",
    "omnichannel-service": "kTLQfrDhcMxyIfm3ftAwX",
    "wellness-service": "HJcKShK3Aoeg4MSS7_2gZ",
    "admin-service": "1VXNF-S8wjgeBL03lbiBg",
    "lead-enrichment-service": "jOMGv45XeZiJJLKUh0XpW",
    "customer-service": "aOrlvIe0th70BHfy-Otvd",
    "intelligence-service": "veysAS0sQW-ccSJ0y9si4",
    "consumer-service": "BJGZSsEssPuP5jFSEOKwY",
    "shell-ui": "VC3lFBiP8it7BdkiI1NSi",
    "sso-ui": "IWAM5xeyicw4EeFgKhVxk",
    "ai-ui": "_Qf4po-uizvqlFjZtM9g-",
    "crm-ui": "45O_2GWDQI6TwaYCit0NK",
    "erp-ui": "_a99go63P91G5eQ-x32mS",
    "finance-ui": "L8H3clWZWIm7qMs6v_CHM",
    "pdv-ui": "IAXqBHDgR1TonxDI8WxsU",
    "rpg-ui": "JPIGUtsX0Y6XjP5k8caR4",
    "omnichannel-ui": "XX2cfSu1TN4IB9Ma4m-70",
    "admin-ui": "FP7PoqOlqXIdzshERmdMB",
    "wellness-ui": "656gBwLGIU29ztuTkMD2x",
    "intelligence-ui": "XzM3rYUtHuptcf0m13sqG",
    "landing-ui": "raXpCM1xkx5k09iduN0xU",
    "docs-ui": "6cJsuf-K-fRf-EnAGgGt7",
    "consumer-ui": "amDUUyJrY3Zy91ho2qZHn",
    "dropshipping-service": "b297O2GbhkQfE94iIGdai",
    "dropshipping-ui": "pWCPRH4MiDSCY1j8OjkXt",
}


def api_call(endpoint, data):
    url = f"{API}/{endpoint}"
    headers = {"Content-Type": "application/json", "x-api-key": KEY}
    body = json.dumps({"json": data}).encode()
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"    HTTP {e.code}: {err[:200]}")
        return None
    except Exception as e:
        print(f"    Error: {e}")
        return None


def deploy(name):
    app_id = APP_IDS.get(name)
    if not app_id:
        print(f"  SKIP {name}: no app ID")
        return False
    result = api_call("application.deploy", {"applicationId": app_id})
    if result:
        print(f"  DEPLOYED: {name}")
        return True
    print(f"  FAILED: {name}")
    return False


def deploy_batch(apps, label, delay=15):
    print(f"\n{'='*60}")
    print(f" Deploying batch: {label} ({len(apps)} apps)")
    print(f"{'='*60}")
    for name in apps:
        deploy(name)
        time.sleep(delay)


BATCH_SIZE = 4
BATCH_DELAY = 10

print("=" * 60)
print(" Deploying ALL 29 applications")
print(" Strategy: backends first, then frontends, 4 at a time")
print("=" * 60)

for i in range(0, len(BACKENDS), BATCH_SIZE):
    batch = BACKENDS[i:i + BATCH_SIZE]
    deploy_batch(batch, f"Backends {i+1}-{i+len(batch)}", delay=BATCH_DELAY)

for i in range(0, len(FRONTENDS), BATCH_SIZE):
    batch = FRONTENDS[i:i + BATCH_SIZE]
    deploy_batch(batch, f"Frontends {i+1}-{i+len(batch)}", delay=BATCH_DELAY)

print("\n" + "=" * 60)
print(" All 29 deploys triggered!")
print(" Monitor progress in Dokploy dashboard: http://72.61.221.19:3000")
print("=" * 60)
