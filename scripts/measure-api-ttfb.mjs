#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import https from "node:https";
import { performance } from "node:perf_hooks";

const USAGE = `Usage: node scripts/measure-api-ttfb.mjs <url> [--runs N] [--header "Name: value"]...

Runs the same URL twice (or N times) and prints time to first byte and total time.
First run vs steady-state comparison supports cold-start diagnosis.

Environment:
  CURL_BIN   Override curl path (default: curl from PATH)
`;

function parseArgs(argv) {
  const url = argv[0];
  const headers = [];
  let runs = 2;
  const rest = argv.slice(1);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--runs") {
      runs = Math.max(1, parseInt(rest[++i] || "2", 10) || 2);
    } else if (a === "--header" || a === "-H") {
      const v = rest[++i];
      if (v) headers.push(v);
    } else if (a === "--help" || a === "-h") {
      console.log(USAGE);
      process.exit(0);
    }
  }
  return { url, runs, headers };
}

function measureWithCurl(url, headers, curlBin) {
  const args = [
    "-sS",
    "-o",
    "/dev/null",
    "-w",
    "%{time_namelookup} %{time_connect} %{time_appconnect} %{time_pretransfer} %{time_starttransfer} %{time_total} %{http_code}\n",
    url,
  ];
  for (const h of headers) {
    args.push("-H", h);
  }
  const r = spawnSync(curlBin, args, { encoding: "utf8" });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    throw new Error(r.stderr || `curl exited ${r.status}`);
  }
  const line = r.stdout.trim().split(/\s+/);
  const [
    timeNamelookup,
    timeConnect,
    timeAppconnect,
    timePretransfer,
    timeStarttransfer,
    timeTotal,
    httpCode,
  ] = line;
  return {
    dnsS: Number(timeNamelookup),
    connectS: Number(timeConnect),
    tlsS: Number(timeAppconnect),
    pretransferS: Number(timePretransfer),
    ttfbS: Number(timeStarttransfer),
    totalS: Number(timeTotal),
    httpCode: Number(httpCode),
  };
}

function measureWithHttps(url, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    if (u.protocol !== "https:") {
      reject(new Error("Node fallback supports https URLs only; install curl for http."));
      return;
    }
    const headerObj = {};
    for (const h of headers) {
      const idx = h.indexOf(":");
      if (idx > 0) {
        headerObj[h.slice(0, idx).trim().toLowerCase()] = h.slice(idx + 1).trim();
      }
    }
    const t0 = performance.now();
    let ttfbMs = null;
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        method: "GET",
        headers: headerObj,
      },
      (res) => {
        ttfbMs = performance.now() - t0;
        res.resume();
        res.on("end", () => {
          resolve({
            ttfbS: ttfbMs / 1000,
            totalS: (performance.now() - t0) / 1000,
            httpCode: res.statusCode ?? 0,
          });
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  const raw = process.argv.slice(2);
  const { url, runs, headers } = parseArgs(raw);
  if (!url) {
    console.error(USAGE);
    process.exit(1);
  }

  const curlBin = process.env.CURL_BIN || "curl";
  const curlCheck = spawnSync(curlBin, ["--version"], { encoding: "utf8" });
  const useCurl = curlCheck.status === 0;

  console.log(`URL: ${url}`);
  console.log(`Runs: ${runs} (${useCurl ? "curl" : "node https"})\n`);

  for (let i = 1; i <= runs; i++) {
    try {
      if (useCurl) {
        const m = measureWithCurl(url, headers, curlBin);
        console.log(`Run ${i}/${runs}`);
        console.log(`  http_code=${m.httpCode}`);
        if (m.dnsS != null) {
          console.log(
            `  dns_s=${m.dnsS.toFixed(3)} connect_s=${m.connectS.toFixed(3)} tls_s=${m.tlsS.toFixed(3)}`,
          );
        }
        console.log(`  ttfb_s=${m.ttfbS.toFixed(3)} total_s=${m.totalS.toFixed(3)}`);
      } else {
        const m = await measureWithHttps(url, headers);
        console.log(`Run ${i}/${runs}`);
        console.log(`  http_code=${m.httpCode}`);
        console.log(`  ttfb_s=${m.ttfbS.toFixed(3)} total_s=${m.totalS.toFixed(3)}`);
      }
    } catch (e) {
      console.error(`Run ${i} failed:`, e instanceof Error ? e.message : e);
      process.exit(1);
    }
    console.log("");
  }

  if (runs >= 2) {
    console.log(
      "Interpretation: if run 1 ttfb >> run 2, suspect cold start, TLS/DNS cache, or DB pool warmup.",
    );
  }
}

main();
