#!/usr/bin/env python3
import json
import urllib.request
import urllib.error
import time

API = "http://72.61.221.19:3000/api/trpc"
KEY = "ScaztGYYFOkIvxByTEkFFqCgOHwWSDvvQCsoFjXEzawJfNqBkkgeKNJiOJADIuTN"

APP_IDS = {
    "crm-ui": "45O_2GWDQI6TwaYCit0NK",
    "erp-ui": "_a99go63P91G5eQ-x32mS",
    "finance-ui": "L8H3clWZWIm7qMs6v_CHM",
    "pdv-ui": "IAXqBHDgR1TonxDI8WxsU",
    "rpg-ui": "JPIGUtsX0Y6XjP5k8caR4",
    "omnichannel-ui": "XX2cfSu1TN4IB9Ma4m-70",
    "admin-ui": "FP7PoqOlqXIdzshERmdMB",
    "wellness-ui": "656gBwLGIU29ztuTkMD2x",
    "intelligence-ui": "XzM3rYUtHuptcf0m13sqG",
    "consumer-ui": "amDUUyJrY3Zy91ho2qZHn",
    "landing-ui": "raXpCM1xkx5k09iduN0xU",
    "docs-ui": "6cJsuf-K-fRf-EnAGgGt7",
}

DOMAINS = [
    ("crm-ui", "portal.gaqno.com.br", "/crm", 80),
    ("erp-ui", "portal.gaqno.com.br", "/erp", 80),
    ("finance-ui", "portal.gaqno.com.br", "/finance", 80),
    ("pdv-ui", "portal.gaqno.com.br", "/pdv", 80),
    ("rpg-ui", "portal.gaqno.com.br", "/rpg", 80),
    ("omnichannel-ui", "portal.gaqno.com.br", "/omnichannel", 80),
    ("admin-ui", "portal.gaqno.com.br", "/admin", 80),
    ("wellness-ui", "portal.gaqno.com.br", "/wellness", 80),
    ("intelligence-ui", "portal.gaqno.com.br", "/intelligence", 80),
    ("consumer-ui", "portal.gaqno.com.br", "/consumer", 80),
    ("landing-ui", "gaqno.com.br", "/", 80),
    ("docs-ui", "docs.gaqno.com.br", "/", 80),
]


def api_call(endpoint, data):
    url = f"{API}/{endpoint}"
    headers = {"Content-Type": "application/json", "x-api-key": KEY}
    body = json.dumps({"json": data}).encode()
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"    HTTP {e.code}: {err[:300]}")
        return None
    except Exception as e:
        print(f"    Error: {e}")
        return None


print("Creating missing domains...")
for name, host, path, port in DOMAINS:
    app_id = APP_IDS.get(name)
    if not app_id:
        print(f"  SKIP {name}: no app ID")
        continue

    print(f"  {name}: {host}{path} :{port}")
    result = api_call("domain.create", {
        "applicationId": app_id,
        "host": host,
        "path": path,
        "port": port,
        "https": False,
        "certificateType": "none",
    })
    if result:
        print(f"    -> OK")
    time.sleep(0.5)

print("\nDone!")
