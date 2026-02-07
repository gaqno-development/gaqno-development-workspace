# Product Data Contract (MVP) — v1

Versioned schema for AI content generation. Use this contract to validate product payloads before sending to AI.

## Version

- **Schema version:** `1.0.0`
- **Status:** MVP (aligned with PDV source of truth; ERP/CRM gaps documented in product-data-inventory.md)

## Required fields

| Field     | Type   | Validation rule                          |
| --------- | ------ | ---------------------------------------- |
| id        | string | UUID format                              |
| name      | string | Non-empty, max 255                      |
| price     | number | >= 0, finite                             |
| tenantId  | string | UUID format                              |

## Optional fields

| Field       | Type   | Validation rule              |
| ----------- | ------ | ---------------------------- |
| description | string | Max 65535                    |
| sku         | string | Max 255                      |
| stock       | number | Integer >= 0                 |

## Validation rules (summary)

- **id, tenantId:** Must match UUID v4 regex.
- **name:** `name.length >= 1 && name.length <= 255`.
- **price:** `typeof price === 'number' && Number.isFinite(price) && price >= 0`.
- **description:** If present, `typeof description === 'string' && description.length <= 65535`.
- **sku:** If present, `typeof sku === 'string' && sku.length <= 255`.
- **stock:** If present, `Number.isInteger(stock) && stock >= 0`.

## JSON Schema

See `scripts/product-data-contract-v1.schema.json` for machine-readable schema.
