-- Create one database per application (run once per Postgres server).
-- Naming: gaqno_<service>_db
--
-- IMPORTANT: CREATE DATABASE cannot run inside a transaction block.
-- In pgAdmin: run each statement ONE BY ONE (F5 runs the whole script in one
-- transaction and will fail).
--
-- Connect to database "postgres", then execute each CREATE DATABASE separately.
-- If a database already exists, that line will error; ignore or comment it out.

CREATE DATABASE gaqno_sso_db;
CREATE DATABASE gaqno_ai_db;
CREATE DATABASE gaqno_finance_db;
CREATE DATABASE gaqno_pdv_db;
CREATE DATABASE gaqno_rpg_db;
CREATE DATABASE gaqno_omnichannel_db;
