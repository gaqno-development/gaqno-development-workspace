#!/usr/bin/env node
/**
 * Product data discovery: output inventory of product fields for AI content engine.
 * GAQNO-1170 / Product Data Discovery (SPIKE). See docs/ai-content/product-data-inventory.md.
 *
 * Usage: node scripts/product-data-discovery.mjs [--json]
 */

const inventory = {
  pdv: {
    service: "gaqno-pdv-service",
    sourceOfTruth: true,
    fields: [
      { name: "id", type: "UUID", required: true },
      { name: "tenantId", type: "UUID", required: true },
      { name: "name", type: "string", required: true },
      { name: "description", type: "text", required: false },
      { name: "price", type: "numeric(10,2)", required: true },
      { name: "stock", type: "integer", required: true },
      { name: "sku", type: "string", required: false },
      { name: "createdAt", type: "timestamp", required: true },
      { name: "updatedAt", type: "timestamp", required: true },
    ],
    gapsForAi: ["category", "images", "marketingCopy", "tags"],
  },
  erp: {
    service: "gaqno-erp-ui (no backend)",
    sourceOfTruth: false,
    fields: [],
    gapsForAi: ["name", "price", "category", "images", "api"],
  },
  crm: {
    service: "gaqno-crm-ui (no backend)",
    sourceOfTruth: false,
    fields: [],
    gapsForAi: ["customerSegments", "buyerPersona", "productLink"],
  },
};

function main() {
  const asJson = process.argv.includes("--json");
  if (asJson) {
    console.log(JSON.stringify(inventory, null, 2));
    return;
  }
  console.log("Product data inventory (AI Content Engine)\n");
  for (const [system, data] of Object.entries(inventory)) {
    console.log(`${system.toUpperCase()}: ${data.service}`);
    console.log(`  Source of truth: ${data.sourceOfTruth}`);
    console.log(`  Fields: ${data.fields.length ? data.fields.map((f) => f.name).join(", ") : "none"}`);
    console.log(`  Gaps for AI: ${data.gapsForAi.join(", ")}`);
    console.log("");
  }
  console.log("See docs/ai-content/product-data-inventory.md for full inventory.");
}

main();
