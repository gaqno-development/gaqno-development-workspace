#!/usr/bin/env node

import pg from "pg";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvValue(envPath, key) {
  try {
    const content = readFileSync(envPath, "utf-8");
    const re = new RegExp(`^${key}=(.+)$`, "m");
    const match = content.match(re);
    return match?.[1]?.trim()?.replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

const DUMMYJSON_BASE =
  process.env.DUMMYJSON_BASE_URL?.replace(/\/$/, "") || "https://dummyjson.com";
const LIMIT = Math.min(
  250,
  Math.max(1, parseInt(process.env.IMPORT_LIMIT || "50", 10)),
);
const SKIP = Math.max(0, parseInt(process.env.IMPORT_SKIP || "0", 10));
const TARGET = (process.env.IMPORT_TARGET || "crm").toLowerCase();
const TENANT_ID = process.env.TENANT_ID?.trim();
const DRY_RUN = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
const CURRENCY = process.env.IMPORT_CURRENCY?.trim() || "USD";
const MAX_IMAGE_URLS = Math.min(
  20,
  Math.max(1, parseInt(process.env.IMPORT_MAX_IMAGES || "5", 10)),
);

const CRM_ENV_PATH = resolve(__dirname, "../gaqno-crm-service/.env");
const ERP_ENV_PATH = resolve(__dirname, "../gaqno-erp-service/.env");

function summarizeDatabaseUrl(connectionString) {
  try {
    const u = new URL(connectionString);
    const db = u.pathname.replace(/^\//, "") || "(no database)";
    const user = u.username ? decodeURIComponent(u.username) : "(no user)";
    return `user=${user} host=${u.hostname} port=${u.port || 5432} database=${db}`;
  } catch {
    return "could not parse DATABASE_URL";
  }
}

function resolveCrmDatabaseUrl() {
  if (process.env.CRM_DATABASE_URL?.trim()) {
    return { url: process.env.CRM_DATABASE_URL.trim(), source: "CRM_DATABASE_URL" };
  }
  const fromFile = loadEnvValue(CRM_ENV_PATH, "DATABASE_URL");
  if (fromFile) {
    return { url: fromFile, source: "gaqno-crm-service/.env" };
  }
  if (process.env.DATABASE_URL?.trim()) {
    return { url: process.env.DATABASE_URL.trim(), source: "DATABASE_URL (shell)" };
  }
  return { url: undefined, source: "" };
}

function resolveErpDatabaseUrl() {
  if (process.env.ERP_DATABASE_URL?.trim()) {
    return { url: process.env.ERP_DATABASE_URL.trim(), source: "ERP_DATABASE_URL" };
  }
  const fromFile = loadEnvValue(ERP_ENV_PATH, "DATABASE_URL");
  if (fromFile) {
    return { url: fromFile, source: "gaqno-erp-service/.env" };
  }
  if (process.env.DATABASE_URL?.trim()) {
    return { url: process.env.DATABASE_URL.trim(), source: "DATABASE_URL (shell)" };
  }
  return { url: undefined, source: "" };
}

function usage() {
  console.error(`
Importa produtos da API DummyJSON (JSON estruturado; não usa scraping HTML).

  Fonte: ${DUMMYJSON_BASE}/products?limit=&skip=
  Ex.: ${DUMMYJSON_BASE}/products/1

Variáveis:
  TENANT_ID          (obrigatório) UUID do tenant
  IMPORT_TARGET      crm | erp | both   (padrão: crm)
  IMPORT_LIMIT       1–250 (padrão: 50)
  IMPORT_SKIP        paginação (padrão: 0)
  IMPORT_CURRENCY    padrão USD
  IMPORT_MAX_IMAGES  URLs JSON por produto (padrão: 5)
  CRM_DATABASE_URL / ERP_DATABASE_URL (ou .env de cada serviço; isso tem prioridade sobre DATABASE_URL no shell)
  DRY_RUN=true       só lista o que seria inserido

Exemplo:
  TENANT_ID=123e4567-e89b-12d3-a456-426614174000 node scripts/import-dummyjson-products.mjs
  IMPORT_TARGET=both IMPORT_LIMIT=80 node scripts/import-dummyjson-products.mjs
`);
}

function isUuid(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v || "",
  );
}

async function fetchProductsPage(limit, skip) {
  const url = `${DUMMYJSON_BASE}/products?limit=${limit}&skip=${skip}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GET ${url} → ${res.status} ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const products = data.products;
  if (!Array.isArray(products)) {
    throw new Error("Resposta DummyJSON sem array products");
  }
  return products;
}

function mapUrls(p) {
  const urls = [];
  if (Array.isArray(p.images)) {
    for (const u of p.images) {
      if (typeof u === "string" && u) urls.push(u);
      if (urls.length >= MAX_IMAGE_URLS) break;
    }
  }
  if (urls.length === 0 && typeof p.thumbnail === "string" && p.thumbnail) {
    urls.push(p.thumbnail);
  }
  return urls.length ? JSON.stringify(urls) : null;
}

function resolveSku(p) {
  if (typeof p.sku === "string" && p.sku.trim()) return p.sku.trim().slice(0, 100);
  return `DUMMYJSON-${p.id}`;
}

async function skuExistsCrm(client, tenantId, sku) {
  const { rows } = await client.query(
    `SELECT 1 FROM crm_products WHERE tenant_id = $1::uuid AND sku = $2 LIMIT 1`,
    [tenantId, sku],
  );
  return rows.length > 0;
}

async function skuExistsErp(client, tenantId, sku) {
  const { rows } = await client.query(
    `SELECT 1 FROM erp_products WHERE tenant_id = $1::uuid AND sku = $2 LIMIT 1`,
    [tenantId, sku],
  );
  return rows.length > 0;
}

async function insertCrm(client, tenantId, row) {
  await client.query(
    `INSERT INTO crm_products (tenant_id, name, sku, category_name, price, currency, image_urls, updated_at)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      tenantId,
      row.name,
      row.sku,
      row.categoryName,
      row.price,
      row.currency,
      row.imageUrls,
    ],
  );
}

async function insertErp(client, tenantId, row) {
  await client.query(
    `INSERT INTO erp_products (tenant_id, name, description, sku, price, stock, category, status, image_urls, updated_at)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, 'active', $8, NOW())`,
    [
      tenantId,
      row.name,
      row.description,
      row.sku,
      row.price,
      row.stock,
      row.category,
      row.imageUrls,
    ],
  );
}

async function main() {
  if (!TENANT_ID || !isUuid(TENANT_ID)) {
    usage();
    console.error("❌ TENANT_ID ausente ou não é um UUID válido.\n");
    process.exit(2);
  }

  if (!["crm", "erp", "both"].includes(TARGET)) {
    usage();
    console.error(`❌ IMPORT_TARGET inválido: ${TARGET}\n`);
    process.exit(2);
  }

  const needCrm = TARGET === "crm" || TARGET === "both";
  const needErp = TARGET === "erp" || TARGET === "both";

  const crmConn = resolveCrmDatabaseUrl();
  const erpConn = resolveErpDatabaseUrl();

  if (needCrm && !crmConn.url) {
    console.error("❌ CRM: defina CRM_DATABASE_URL ou DATABASE_URL em gaqno-crm-service/.env\n");
    process.exit(2);
  }
  if (needErp && !erpConn.url) {
    console.error("❌ ERP: defina ERP_DATABASE_URL ou DATABASE_URL em gaqno-erp-service/.env\n");
    process.exit(2);
  }

  console.log(`📥 DummyJSON limit=${LIMIT} skip=${SKIP} target=${TARGET}${DRY_RUN ? " (DRY_RUN)" : ""}\n`);
  if (needCrm && crmConn.url && !DRY_RUN) {
    console.log(`🔗 CRM: ${summarizeDatabaseUrl(crmConn.url)} ← ${crmConn.source}`);
  }
  if (needErp && erpConn.url && !DRY_RUN) {
    console.log(`🔗 ERP: ${summarizeDatabaseUrl(erpConn.url)} ← ${erpConn.source}`);
  }
  if ((needCrm || needErp) && !DRY_RUN) console.log("");

  const raw = await fetchProductsPage(LIMIT, SKIP);

  const rows = raw.map((p) => {
    const title = typeof p.title === "string" ? p.title : `Product ${p.id}`;
    const category =
      typeof p.category === "string" ? p.category.slice(0, 100) : null;
    const price =
      typeof p.price === "number" && Number.isFinite(p.price)
        ? String(p.price)
        : "0";
    const stock =
      typeof p.stock === "number" && Number.isFinite(p.stock)
        ? Math.max(0, Math.floor(p.stock))
        : 0;
    const description =
      typeof p.description === "string" ? p.description : null;
    return {
      name: title.slice(0, 255),
      sku: resolveSku(p),
      categoryName: category ? category.slice(0, 255) : null,
      category,
      price,
      stock,
      description,
      currency: CURRENCY.slice(0, 10),
      imageUrls: mapUrls(p),
    };
  });

  if (DRY_RUN) {
    for (const r of rows) {
      console.log(`  — ${r.sku} | ${r.name} | ${r.price} ${r.currency}`);
    }
    console.log(`\n${rows.length} produto(s) (nenhum insert em DRY_RUN).`);
    return;
  }

  const crmPool = needCrm ? new pg.Pool({ connectionString: crmConn.url }) : null;
  const erpPool = needErp ? new pg.Pool({ connectionString: erpConn.url }) : null;

  let insertedCrm = 0;
  let skippedCrm = 0;
  let insertedErp = 0;
  let skippedErp = 0;

  try {
    const crmClient = needCrm ? await crmPool.connect() : null;
    const erpClient = needErp ? await erpPool.connect() : null;

    try {
      if (crmClient) await crmClient.query("BEGIN");
      if (erpClient) await erpClient.query("BEGIN");

      for (const r of rows) {
        if (crmClient) {
          if (await skuExistsCrm(crmClient, TENANT_ID, r.sku)) {
            skippedCrm += 1;
          } else {
            await insertCrm(crmClient, TENANT_ID, r);
            insertedCrm += 1;
          }
        }
        if (erpClient) {
          if (await skuExistsErp(erpClient, TENANT_ID, r.sku)) {
            skippedErp += 1;
          } else {
            await insertErp(erpClient, TENANT_ID, r);
            insertedErp += 1;
          }
        }
      }

      if (crmClient) await crmClient.query("COMMIT");
      if (erpClient) await erpClient.query("COMMIT");
    } catch (e) {
      if (crmClient) await crmClient.query("ROLLBACK").catch(() => {});
      if (erpClient) await erpClient.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      crmClient?.release();
      erpClient?.release();
    }
  } finally {
    await crmPool?.end().catch(() => {});
    await erpPool?.end().catch(() => {});
  }

  if (needCrm) {
    console.log(`✅ CRM: inseridos ${insertedCrm}, ignorados (sku existente) ${skippedCrm}`);
  }
  if (needErp) {
    console.log(`✅ ERP: inseridos ${insertedErp}, ignorados (sku existente) ${skippedErp}`);
  }
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(msg);
  const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
  if (code === "28P01" || msg.includes("password authentication failed")) {
    console.error(`
PostgreSQL recusou usuário/senha.

Corrija a senha em DATABASE_URL:
  • CRM → gaqno-crm-service/.env (ou CRM_DATABASE_URL=... na linha de comando)
  • ERP → gaqno-erp-service/.env (ou ERP_DATABASE_URL=...)

Se você tinha exportado DATABASE_URL no terminal, antes ela podia sobrescrever o .env do CRM.
Agora o script usa primeiro o .env do serviço; confira se a senha nesse arquivo bate com o Postgres em execução (Docker/local).
`);
  }
  process.exit(1);
});
