# ERP Product Foundation (GAQNO-1162)

Minimum product data exposed by ERP for AI content generation. Aligned with Product Data Contract v1.

## Endpoint

- **GET** `/erp/products` – list products (name, price, category, image URLs).

## Required fields

| Field    | Type   |
| -------- | ------ |
| id       | string (UUID) |
| name     | string |
| price    | number |
| tenantId | string (UUID) |

## Optional (ERP foundation)

| Field     | Type     |
| --------- | -------- |
| category  | string   |
| imageUrls | string[] |

## Backend implementation

- **gaqno-ai-service:** `ErpModule`, `ErpProductDto`, `GET /erp/products` stub (GAQNO-1178).
