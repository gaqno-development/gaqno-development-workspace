-- Create one database per application (run once per Postgres server).
--
-- IMPORTANT: CREATE DATABASE cannot run inside a transaction block.
-- In pgAdmin: run each statement ONE BY ONE (F5 runs the whole script in one
-- transaction and will fail). Or use create-databases.sh with DATABASE_URL.
--
-- Connect to database "postgres", then execute each CREATE DATABASE separately.
-- If a database already exists, that line will error; ignore or comment it out.

CREATE DATABASE gaqno_sso;
CREATE DATABASE gaqno_ai;
CREATE DATABASE gaqno_finance;
CREATE DATABASE gaqno_pdv;
CREATE DATABASE gaqno_rpg;
CREATE DATABASE gaqno_omnichannel;
