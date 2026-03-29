\pset pager off

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM erp_products
WHERE tenant_id = :'tenant'::uuid
LIMIT 200;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM erp_suppliers
WHERE tenant_id = :'tenant'::uuid
LIMIT 50;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM erp_warehouses
WHERE tenant_id = :'tenant'::uuid;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM erp_stock_movements
WHERE tenant_id = :'tenant'::uuid
ORDER BY created_at DESC
LIMIT 100;
