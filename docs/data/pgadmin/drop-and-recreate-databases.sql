-- Drop and recreate gaqno databases (run in pgAdmin).
-- WARNING: This DELETES ALL DATA. Use only for fresh setup.
--
-- Connect to database "postgres".
--
-- STEP 1: Terminate all connections to gaqno databases (run this first, as one block):
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname IN ('gaqno_sso', 'gaqno_ai', 'gaqno_finance', 'gaqno_pdv', 'gaqno_rpg', 'gaqno_omnichannel', 'gaqno_sso_db', 'gaqno_ai_db', 'gaqno_finance_db', 'gaqno_pdv_db', 'gaqno_rpg_db', 'gaqno_omnichannel_db')
  AND pid <> pg_backend_pid();

-- STEP 2: Run each DROP below ONE AT A TIME (select one line, F5). Do NOT run all at once.
DROP DATABASE IF EXISTS gaqno_sso;
DROP DATABASE IF EXISTS gaqno_ai;
DROP DATABASE IF EXISTS gaqno_finance;
DROP DATABASE IF EXISTS gaqno_pdv;
DROP DATABASE IF EXISTS gaqno_rpg;
DROP DATABASE IF EXISTS gaqno_omnichannel;

DROP DATABASE IF EXISTS gaqno_sso_db;
DROP DATABASE IF EXISTS gaqno_ai_db;
DROP DATABASE IF EXISTS gaqno_finance_db;
DROP DATABASE IF EXISTS gaqno_pdv_db;
DROP DATABASE IF EXISTS gaqno_rpg_db;
DROP DATABASE IF EXISTS gaqno_omnichannel_db;

-- Then run create-databases.sql (each CREATE DATABASE separately).
