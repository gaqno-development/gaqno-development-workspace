#!/usr/bin/env node
/**
 * Validate a product payload against the MVP product data contract (v1).
 * GAQNO-1161 / Define Product Data Contract (MVP).
 *
 * Usage: node scripts/product-data-contract-validate.mjs (reads JSON from stdin)
 *        echo '{"id":"...","name":"x","price":1,"tenantId":"..."}' | node scripts/product-data-contract-validate.mjs
 */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(s) {
  return typeof s === "string" && UUID_REGEX.test(s);
}

function validateRequired(obj) {
  const errors = [];
  if (!isUuid(obj.id)) errors.push("id: must be a valid UUID");
  if (!isUuid(obj.tenantId)) errors.push("tenantId: must be a valid UUID");
  if (typeof obj.name !== "string" || obj.name.length < 1 || obj.name.length > 255)
    errors.push("name: non-empty string, max 255");
  const price = obj.price;
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0)
    errors.push("price: number >= 0");
  return errors;
}

function validateOptional(obj) {
  const errors = [];
  if (obj.description != null) {
    if (typeof obj.description !== "string" || obj.description.length > 65535)
      errors.push("description: string, max 65535");
  }
  if (obj.sku != null) {
    if (typeof obj.sku !== "string" || obj.sku.length > 255)
      errors.push("sku: string, max 255");
  }
  if (obj.stock != null) {
    if (!Number.isInteger(obj.stock) || obj.stock < 0)
      errors.push("stock: integer >= 0");
  }
  return errors;
}

function validate(obj) {
  if (obj === null || typeof obj !== "object") {
    return { valid: false, errors: ["Payload must be an object"] };
  }
  const requiredErrors = validateRequired(obj);
  const optionalErrors = validateOptional(obj);
  const errors = [...requiredErrors, ...optionalErrors];
  return { valid: errors.length === 0, errors };
}

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    console.error("No JSON input. Pipe a product JSON object to stdin.");
    process.exit(2);
  }
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    console.error("Invalid JSON:", e.message);
    process.exit(2);
  }
  const result = validate(obj);
  if (result.valid) {
    console.log("OK");
    process.exit(0);
  }
  console.error("Validation failed:");
  result.errors.forEach((e) => console.error("  -", e));
  process.exit(1);
}

main();
