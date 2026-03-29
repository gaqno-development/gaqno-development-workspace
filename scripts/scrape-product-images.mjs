#!/usr/bin/env node

import pg from "pg";
import { S3Client, PutObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────

function loadDatabaseUrlFromFile(envPath) {
  try {
    const content = readFileSync(envPath, "utf-8");
    const match = content.match(/^DATABASE_URL=(.+)$/m);
    return match?.[1]?.trim()?.replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

function loadErpDatabaseUrl() {
  return (
    loadDatabaseUrlFromFile(resolve(__dirname, "../gaqno-erp-service/.env")) ||
    loadDatabaseUrlFromFile(resolve(__dirname, "../.env"))
  );
}

const DATABASE_URL = process.env.DATABASE_URL || loadErpDatabaseUrl();
const SCRAPE_SYNC_CRM =
  process.env.SCRAPE_SYNC_CRM === "true" || process.env.SCRAPE_SYNC_CRM === "1";
const CRM_SYNC_BASE = (
  process.env.SCRAPE_CRM_BASE_URL ||
  process.env.SEED_CRM_BASE_URL ||
  (SCRAPE_SYNC_CRM ? "http://localhost:4003/v1" : "")
).replace(/\/$/, "");
const CRM_SYNC_TOKEN =
  process.env.SCRAPE_CRM_TOKEN ||
  process.env.SEED_ACCESS_TOKEN ||
  process.env.GAQNO_JWT ||
  "";
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "17c0f489f699231dff3588ca19a9cb9a";
const R2_ACCESS_KEY_ID =
  process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY || "";

const r2TokenEnv = process.env.R2_TOKEN?.trim() || "";
const r2SecretFromToken =
  r2TokenEnv && !r2TokenEnv.startsWith("cfat_") ? r2TokenEnv : "";

const R2_SECRET_ACCESS_KEY =
  process.env.R2_SECRET_ACCESS_KEY ||
  process.env.R2_SECRET_KEY ||
  r2SecretFromToken ||
  "";
const R2_BUCKET = process.env.R2_BUCKET || "gaqno-media";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://cdn.gaqno.com.br";
const IMAGES_PER_PRODUCT = parseInt(process.env.IMAGES_PER_PRODUCT || "3", 10);
const DRY_RUN = process.env.DRY_RUN === "true";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// ─── Validation ──────────────────────────────────────────────────────

function validateConfig() {
  const missing = [];
  if (!DATABASE_URL) missing.push("DATABASE_URL");
  if (!DRY_RUN) {
    if (!R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID or R2_ACCESS_KEY");
    if (!R2_SECRET_ACCESS_KEY) {
      missing.push("R2_SECRET_ACCESS_KEY or R2_SECRET_KEY (or R2_TOKEN if it is the S3 secret, not a cfat_ API token)");
    }
  }
  if (missing.length > 0) {
    console.error(`\n❌ Missing required env vars: ${missing.join(", ")}`);
    console.error(`\nUsage:`);
    console.error(`  R2_ACCESS_KEY=xxx R2_SECRET_ACCESS_KEY=yyy node scripts/scrape-product-images.mjs`);
    console.error(`  (or R2_ACCESS_KEY_ID, R2_SECRET_KEY; R2_TOKEN only if it is the S3 secret — not cfat_… API tokens)\n`);
    console.error(`  DRY_RUN=true node scripts/scrape-product-images.mjs  # only DATABASE_URL; no R2 upload/DB write\n`);
    console.error(`To create R2 API tokens:`);
    console.error(`  1. Go to https://dash.cloudflare.com → R2 Object Storage → Manage R2 API tokens`);
    console.error(`  2. Create a token with "Object Read & Write" for bucket "${R2_BUCKET}"`);
    console.error(`  3. Copy the Access Key ID and Secret Access Key\n`);
    process.exit(1);
  }
}

// ─── DuckDuckGo Image Search ─────────────────────────────────────────

async function getVQDToken(query) {
  const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
  const resp = await fetch(url, { headers: { "User-Agent": UA } });
  const html = await resp.text();
  const match = html.match(/vqd=['"]([^'"]+)['"]/);
  if (!match) {
    const match2 = html.match(/vqd=([\d-]+)/);
    return match2?.[1] ?? null;
  }
  return match[1];
}

async function searchImages(query, count = 5) {
  const vqd = await getVQDToken(query);
  if (!vqd) {
    console.warn(`  ⚠ Could not get VQD token for "${query}"`);
    return [];
  }

  const url = new URL("https://duckduckgo.com/i.js");
  url.searchParams.set("l", "us-en");
  url.searchParams.set("o", "json");
  url.searchParams.set("q", query);
  url.searchParams.set("vqd", vqd);
  url.searchParams.set("f", ",,,,,");
  url.searchParams.set("p", "1");

  const resp = await fetch(url.toString(), {
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
      Referer: "https://duckduckgo.com/",
    },
  });

  if (!resp.ok) {
    console.warn(`  ⚠ DuckDuckGo returned ${resp.status} for "${query}"`);
    return [];
  }

  const data = await resp.json();
  const results = data.results || [];

  return results
    .filter((r) => r.image && /\.(jpe?g|png|webp)/i.test(r.image))
    .slice(0, count)
    .map((r) => ({
      url: r.image,
      thumbnail: r.thumbnail,
      width: r.width,
      height: r.height,
      title: r.title,
    }));
}

// ─── Image Download ──────────────────────────────────────────────────

async function downloadImage(imageUrl, timeoutMs = 15_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(imageUrl, {
      headers: { "User-Agent": UA },
      signal: controller.signal,
      redirect: "follow",
    });

    if (!resp.ok) return null;

    const contentType = resp.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return null;

    const buffer = Buffer.from(await resp.arrayBuffer());
    if (buffer.length < 1000) return null;

    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";

    return { buffer, contentType, ext };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ─── R2 Upload ───────────────────────────────────────────────────────

function createR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

async function verifyBucket(s3) {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: R2_BUCKET }));
    return true;
  } catch (err) {
    console.error(`\n❌ Cannot access R2 bucket "${R2_BUCKET}": ${err.message}`);
    console.error(`   Make sure the bucket exists and the API token has access.\n`);
    return false;
  }
}

async function uploadToR2(s3, key, buffer, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}

// ─── Database ────────────────────────────────────────────────────────

async function fetchProducts(pool) {
  const { rows } = await pool.query(
    `SELECT id, name, sku, category, image_urls FROM erp_products ORDER BY name`,
  );
  return rows;
}

async function updateProductImages(pool, productId, imageUrlsJson) {
  await pool.query(`UPDATE erp_products SET image_urls = $1, updated_at = NOW() WHERE id = $2`, [
    imageUrlsJson,
    productId,
  ]);
}

function describeDatabaseUrl(url) {
  try {
    const u = new URL(url);
    const db = u.pathname.replace(/^\//, "") || "(no database)";
    return `host=${u.hostname} port=${u.port || 5432} user=${u.username} database=${db}`;
  } catch {
    return "invalid DATABASE_URL";
  }
}

// ─── Rate Limiter ────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function buildCrmSkuIndex(baseUrl, token) {
  const res = await fetch(`${baseUrl}/products`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET /products ${res.status} ${text.slice(0, 160)}`);
  }
  const items = await res.json();
  const m = new Map();
  if (!Array.isArray(items)) return m;
  for (const p of items) {
    if (p && typeof p.sku === "string" && p.sku && typeof p.id === "string") {
      m.set(p.sku, p.id);
    }
  }
  return m;
}

async function syncCrmProductImages(baseUrl, token, skuMap, sku, imageUrlsJson) {
  const id = skuMap.get(sku);
  if (!id) {
    console.log(`  ℹ CRM: no product with sku "${sku}"`);
    return;
  }
  const res = await fetch(`${baseUrl}/products/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ imageUrls: imageUrlsJson }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.warn(`  ⚠ CRM PATCH ${res.status}: ${text.slice(0, 120)}`);
    return;
  }
  console.log(`  📎 CRM: synced images for sku ${sku}`);
}

async function main() {
  validateConfig();

  if (DRY_RUN) console.log("🏜  DRY RUN — no uploads or DB updates\n");

  let crmSkuToId = null;
  if (SCRAPE_SYNC_CRM && !DRY_RUN) {
    if (!CRM_SYNC_TOKEN) {
      console.error("SCRAPE_SYNC_CRM requires SCRAPE_CRM_TOKEN, SEED_ACCESS_TOKEN, or GAQNO_JWT.");
      process.exit(2);
    }
    if (!CRM_SYNC_BASE) {
      console.error("SCRAPE_SYNC_CRM requires SCRAPE_CRM_BASE_URL or SEED_CRM_BASE_URL.");
      process.exit(2);
    }
    try {
      crmSkuToId = await buildCrmSkuIndex(CRM_SYNC_BASE, CRM_SYNC_TOKEN);
      console.log(`📎 CRM: ${crmSkuToId.size} products with sku\n`);
    } catch (e) {
      console.error("CRM:", e instanceof Error ? e.message : e);
      process.exit(1);
    }
  }

  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const s3 = DRY_RUN ? null : createR2Client();

  if (!DRY_RUN && s3) {
    const bucketOk = await verifyBucket(s3);
    if (!bucketOk) process.exit(1);
  }

  let products;
  try {
    products = await fetchProducts(pool);
  } catch (err) {
    await pool.end().catch(() => {});
    if (err && typeof err === "object" && "code" in err && err.code === "28P01") {
      console.error("\n❌ PostgreSQL password authentication failed (28P01).");
      console.error(`   ${describeDatabaseUrl(DATABASE_URL)}`);
      console.error(
        "   Fix gaqno-erp-service/.env DATABASE_URL, or set DATABASE_URL in the shell to override both .env files.",
      );
      console.error(
        "   Local: use DATABASE_URL that matches a running Postgres with database gaqno_erp_db (see init-databases.sh in production compose).\n",
      );
      process.exit(1);
    }
    throw err;
  }
  console.log(`📦 Found ${products.length} products\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const product of products) {
    const existing = product.image_urls;
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`⏭  ${product.name} — already has ${parsed.length} image(s), skipping`);
          skipped++;
          continue;
        }
      } catch {
        /* not valid JSON, re-scrape */
      }
    }

    const searchQuery = [product.name, product.category, "produto"]
      .filter(Boolean)
      .join(" ");

    console.log(`🔍 Searching: "${searchQuery}"`);

    const images = await searchImages(searchQuery, IMAGES_PER_PRODUCT + 2);

    if (images.length === 0) {
      console.log(`  ❌ No images found for "${product.name}"`);
      failed++;
      await sleep(2000);
      continue;
    }

    const uploadedUrls = [];
    let idx = 0;

    for (const img of images) {
      if (uploadedUrls.length >= IMAGES_PER_PRODUCT) break;

      const downloaded = await downloadImage(img.url);
      if (!downloaded) {
        console.log(`  ⚠ Failed to download: ${img.url.slice(0, 80)}…`);
        continue;
      }

      const slug = (product.sku || product.id).replace(/[^a-zA-Z0-9_-]/g, "_");
      const key = `products/${slug}/${idx}.${downloaded.ext}`;

      if (DRY_RUN) {
        console.log(`  📸 [dry-run] Would upload ${key} (${(downloaded.buffer.length / 1024).toFixed(1)} KB)`);
        uploadedUrls.push(`${R2_PUBLIC_URL}/${key}`);
      } else {
        try {
          const publicUrl = await uploadToR2(s3, key, downloaded.buffer, downloaded.contentType);
          uploadedUrls.push(publicUrl);
          console.log(`  ✅ Uploaded ${key} (${(downloaded.buffer.length / 1024).toFixed(1)} KB)`);
        } catch (err) {
          console.log(`  ❌ Upload failed: ${err.message}`);
        }
      }

      idx++;
      await sleep(300);
    }

    if (uploadedUrls.length > 0) {
      const json = JSON.stringify(uploadedUrls);
      if (!DRY_RUN) {
        await updateProductImages(pool, product.id, json);
        if (crmSkuToId && product.sku) {
          await syncCrmProductImages(CRM_SYNC_BASE, CRM_SYNC_TOKEN, crmSkuToId, product.sku, json);
        }
      }
      console.log(`  📝 ${product.name} → ${uploadedUrls.length} image(s) saved\n`);
      uploaded++;
    } else {
      console.log(`  ❌ Could not download any images for "${product.name}"\n`);
      failed++;
    }

    await sleep(2000);
  }

  console.log(`\n─── Summary ───`);
  console.log(`✅ Uploaded:  ${uploaded}`);
  console.log(`⏭  Skipped:   ${skipped}`);
  console.log(`❌ Failed:    ${failed}`);
  console.log(`📦 Total:     ${products.length}\n`);

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
