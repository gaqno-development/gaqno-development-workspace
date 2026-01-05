require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();

  try {
    console.log('🚀 Creating Finance service tables (idempotent, no drops)...');

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE transaction_status AS ENUM('pago', 'a_pagar', 'em_atraso');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE TYPE transaction_type AS ENUM('income', 'expense');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE TYPE recurrence_type AS ENUM('none', 'fifth_business_day', 'day_15', 'last_day', 'custom');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    console.log('✅ Enums created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS finance_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        tenant_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        type transaction_type NOT NULL,
        color VARCHAR(50),
        icon VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS finance_subcategories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        tenant_id UUID NOT NULL,
        parent_category_id UUID NOT NULL REFERENCES finance_categories(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        icon VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS finance_credit_cards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        tenant_id UUID NOT NULL,
        user_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        last_four_digits VARCHAR(4) NOT NULL,
        card_type VARCHAR(50) NOT NULL,
        bank_name VARCHAR(255),
        credit_limit NUMERIC(10,2) NOT NULL,
        closing_day INTEGER NOT NULL,
        due_day INTEGER NOT NULL,
        color VARCHAR(50) NOT NULL,
        icon VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS finance_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        tenant_id UUID NOT NULL,
        user_id UUID NOT NULL,
        category_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
        subcategory_id UUID REFERENCES finance_subcategories(id) ON DELETE SET NULL,
        credit_card_id UUID REFERENCES finance_credit_cards(id) ON DELETE SET NULL,
        description VARCHAR(500) NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        type transaction_type NOT NULL,
        transaction_date TIMESTAMP NOT NULL,
        due_date TIMESTAMP,
        status transaction_status NOT NULL DEFAULT 'a_pagar',
        assigned_to UUID,
        notes TEXT,
        installment_count INTEGER NOT NULL DEFAULT 1,
        installment_current INTEGER NOT NULL DEFAULT 1,
        is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
        recurring_type recurrence_type,
        recurring_day INTEGER,
        recurring_months INTEGER,
        icon VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ Tables created/verified');

    await client.query(`
      CREATE INDEX IF NOT EXISTS finance_categories_tenant_idx ON finance_categories(tenant_id);
      CREATE INDEX IF NOT EXISTS finance_subcategories_tenant_idx ON finance_subcategories(tenant_id);
      CREATE INDEX IF NOT EXISTS finance_subcategories_parent_idx ON finance_subcategories(parent_category_id);
      CREATE INDEX IF NOT EXISTS finance_credit_cards_tenant_idx ON finance_credit_cards(tenant_id);
      CREATE INDEX IF NOT EXISTS finance_credit_cards_user_idx ON finance_credit_cards(user_id);
      CREATE INDEX IF NOT EXISTS finance_transactions_tenant_idx ON finance_transactions(tenant_id);
      CREATE INDEX IF NOT EXISTS finance_transactions_user_idx ON finance_transactions(user_id);
      CREATE INDEX IF NOT EXISTS finance_transactions_category_idx ON finance_transactions(category_id);
      CREATE INDEX IF NOT EXISTS finance_transactions_subcategory_idx ON finance_transactions(subcategory_id);
      CREATE INDEX IF NOT EXISTS finance_transactions_credit_card_idx ON finance_transactions(credit_card_id);
      CREATE INDEX IF NOT EXISTS finance_transactions_status_idx ON finance_transactions(status);
      CREATE INDEX IF NOT EXISTS finance_transactions_type_idx ON finance_transactions(type);
      CREATE INDEX IF NOT EXISTS finance_transactions_date_idx ON finance_transactions(transaction_date);
    `);
    console.log('✅ Indexes created/verified');

    console.log('\\n✅ Finance service schema ensured successfully!');
  } catch (err) {
    console.error('❌ Error ensuring schema:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err.message);
  process.exit(1);
});

