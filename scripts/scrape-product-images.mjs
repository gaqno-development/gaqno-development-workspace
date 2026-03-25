#!/usr/bin/env node
/**
 * Scrape product images from DuckDuckGo and upload to Cloudflare R2.
 *
 * Usage:
 *   R2_ACCESS_KEY_ID=xxx R2_SECRET_ACCESS_KEY=yyy node scripts/scrape-product-images.mjs
 *
 * Optional env vars:
 *   DATABASE_URL          — ERP database (default: from gaqno-erp-service/.env)
 *   R2_ACCOUNT_ID         — Cloudflare account  (default: 17c0f489f699231dff3588ca19a9cb9a)
 *   R2_BUCKET             — R2 bucket name       (default: gaqno-media)
 *   R2_PUBLIC_URL         — Public URL prefix     (default: https://media.gaqno.com.br)
 *   IMAGES_PER_PRODUCT    — How many images       (default: 3)
 *   DRY_RUN               — Set "true" to skip upload + DB update
 */

import pg from "pg";
import { S3Client, PutObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────

function loadErpDatabaseUrl() {
  try {
    const envPath = resolve(__dirname, "../gaqno-erp-service/.env");
    const content = readFileSync(envPath, "utf-8");
    const match = content.match(/DATABASE_URL=(.+)/);
    return match?.[1]?.trim();
  } catch {
    return undefined;
  }
}

const DATABASE_URL = process.env.DATABASE_URL || loadErpDatabaseUrl();
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "17c0f489f699231dff3588ca19a9cb9a";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET || "gaqno-media";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://media.gaqno.com.br";
const IMAGES_PER_PRODUCT = parseInt(process.env.IMAGES_PER_PRODUCT || "3", 10);
const DRY_RUN = process.env.DRY_RUN === "true";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// ─── Validation ──────────────────────────────────────────────────────

function validateConfig() {
  const missing = [];
  if (!DATABASE_URL) missing.push("DATABASE_URL");
  if (!R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
  if (!R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
  if (missing.length > 0) {
    console.error(`\n❌ Missing required env vars: ${missing.join(", ")}`);
    console.error(`\nUsage:`);
    console.error(`  R2_ACCESS_KEY_ID=xxx R2_SECRET_ACCESS_KEY=yyy node scripts/scrape-product-images.mjs\n`);
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

// ─── Rate Limiter ────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  validateConfig();

  if (DRY_RUN) console.log("🏜  DRY RUN — no uploads or DB updates\n");

  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const s3 = createR2Client();

  if (!DRY_RUN) {
    const bucketOk = await verifyBucket(s3);
    if (!bucketOk) process.exit(1);
  }

  const products = await fetchProducts(pool);
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
