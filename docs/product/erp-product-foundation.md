# ERP Product Foundation (GAQNO-1162)

Minimum product data exposed by ERP for AI content generation. Aligned with Product Data Contract v1.

## Endpoint

- **GET** `/erp/products` – list products (name, price, category, image URLs).

## Required fields

| Field    | Type          |
| -------- | ------------- |
| id       | string (UUID) |
| name     | string        |
| price    | number        |
| tenantId | string (UUID) |

## Optional (ERP foundation)

| Field     | Type     |
| --------- | -------- |
| category  | string   |
| imageUrls | string[] |

## Backend implementation

- **gaqno-ai-service:** `ErpModule`, `ErpService`, `ErpProductDto`, `GET /erp/products` (GAQNO-1178).
  - Query: `tenantId` (UUID, optional), `limit` (1–100, default 20), `offset` (default 0).
  - Returns array of contract-aligned products; stub data until ERP integration.
