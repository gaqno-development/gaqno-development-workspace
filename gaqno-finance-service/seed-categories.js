require('dotenv').config();
const { Pool } = require('pg');

const DEFAULT_CATEGORIES = [
  { name: 'Moradia', type: 'expense', color: '#3b82f6', icon: '🏠' },
  { name: 'Empréstimos', type: 'expense', color: '#ef4444', icon: '💳' },
  { name: 'Carro', type: 'expense', color: '#f59e0b', icon: '🚗' },
  { name: 'Alimentação', type: 'expense', color: '#10b981', icon: '🍽️' },
  { name: 'Lazer', type: 'expense', color: '#8b5cf6', icon: '🎮' },
  { name: 'Educação', type: 'expense', color: '#06b6d4', icon: '📚' },
  { name: 'Assinaturas', type: 'expense', color: '#ec4899', icon: '📱' },
  { name: 'Saúde', type: 'expense', color: '#f43f5e', icon: '🏥' },
  { name: 'Transporte', type: 'expense', color: '#6366f1', icon: '🚌' },
  { name: 'Roupas', type: 'expense', color: '#a855f7', icon: '👕' },
  { name: 'Salário', type: 'income', color: '#22c55e', icon: '💰' },
  { name: 'Freelance', type: 'income', color: '#14b8a6', icon: '💼' },
  { name: 'Investimentos', type: 'income', color: '#0ea5e9', icon: '📈' },
  { name: 'Outros', type: 'expense', color: '#6b7280', icon: '📦' },
];

async function seedCategories(tenantId) {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();

  try {
    if (tenantId) {
      console.log(`🌱 Seeding default categories for tenant: ${tenantId}...`);
      
      for (const category of DEFAULT_CATEGORIES) {
        // Check if category already exists
        const existing = await client.query(
          `SELECT id FROM finance_categories WHERE tenant_id = $1 AND name = $2`,
          [tenantId, category.name]
        );
        
        if (existing.rows.length > 0) {
          console.log(`  ⏭️  Skipped (already exists): ${category.name}`);
          continue;
        }
        
        const result = await client.query(
          `INSERT INTO finance_categories (tenant_id, name, type, color, icon)
           VALUES ($1, $2, $3::transaction_type, $4, $5)
           RETURNING id, name`,
          [tenantId, category.name, category.type, category.color, category.icon]
        );
        
        if (result.rows.length > 0) {
          console.log(`  ✅ Created: ${category.name}`);
        }
      }
    } else {
      console.log('🌱 Seeding default categories for all tenants...');
      
      const tenantResult = await client.query(
        `SELECT DISTINCT tenant_id FROM finance_categories 
         UNION 
         SELECT DISTINCT tenant_id FROM finance_transactions 
         WHERE tenant_id IS NOT NULL`
      );
      
      if (tenantResult.rows.length === 0) {
        console.log('⚠️  No tenants found. Please provide a tenant_id as argument:');
        console.log('   node seed-categories.js <tenant-id>');
        return;
      }

      for (const tenant of tenantResult.rows) {
        console.log(`\n📦 Seeding for tenant: ${tenant.tenant_id}`);
        for (const category of DEFAULT_CATEGORIES) {
          // Check if category already exists
          const existing = await client.query(
            `SELECT id FROM finance_categories WHERE tenant_id = $1 AND name = $2`,
            [tenant.tenant_id, category.name]
          );
          
          if (existing.rows.length > 0) {
            console.log(`  ⏭️  Skipped (already exists): ${category.name}`);
            continue;
          }
          
          const result = await client.query(
            `INSERT INTO finance_categories (tenant_id, name, type, color, icon)
             VALUES ($1, $2, $3::transaction_type, $4, $5)
             RETURNING id, name`,
            [tenant.tenant_id, category.name, category.type, category.color, category.icon]
          );
          
          if (result.rows.length > 0) {
            console.log(`  ✅ Created: ${category.name}`);
          }
        }
      }
    }

    console.log(`\n✅ Default categories seeded successfully!`);
  } catch (err) {
    console.error('❌ Error seeding categories:', err.message);
    console.error(err.stack);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

const tenantId = process.argv[2] || null;
seedCategories(tenantId).catch((err) => {
  console.error('❌ Unexpected error:', err.message);
  process.exit(1);
});

