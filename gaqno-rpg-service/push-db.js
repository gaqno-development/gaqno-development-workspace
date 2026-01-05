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
    console.log('🚀 Creating RPG service tables (idempotent, no drops)...');

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE session_status AS ENUM('draft', 'active', 'paused', 'completed', 'archived');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      
      DO $$ BEGIN
        CREATE TYPE campaign_status AS ENUM('draft', 'active', 'archived');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      
      DO $$ BEGIN
        CREATE TYPE memory_type AS ENUM('general', 'canonical', 'improvised');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      
      DO $$ BEGIN
        CREATE TYPE location_type AS ENUM('dungeon', 'city', 'region', 'landmark', 'building');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    console.log('✅ Enums created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS rpg_campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        tenant_id UUID,
        user_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        concept JSONB,
        world JSONB,
        initial_narrative JSONB,
        npcs JSONB NOT NULL DEFAULT '[]',
        hooks JSONB NOT NULL DEFAULT '[]',
        is_public BOOLEAN NOT NULL DEFAULT false,
        status campaign_status NOT NULL DEFAULT 'draft',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS rpg_campaigns_tenant_idx ON rpg_campaigns(tenant_id);
      CREATE INDEX IF NOT EXISTS rpg_campaigns_user_idx ON rpg_campaigns(user_id);
      CREATE INDEX IF NOT EXISTS rpg_campaigns_public_idx ON rpg_campaigns(is_public);
      
      CREATE TABLE IF NOT EXISTS rpg_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        tenant_id UUID,
        user_id UUID NOT NULL,
        campaign_id UUID REFERENCES rpg_campaigns(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status session_status NOT NULL DEFAULT 'draft',
        room_code VARCHAR(10) NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'rpg_sessions' AND column_name = 'room_code'
        ) THEN
          ALTER TABLE rpg_sessions ADD COLUMN room_code VARCHAR(10) UNIQUE;
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'rpg_sessions' AND column_name = 'campaign_id'
        ) THEN
          ALTER TABLE rpg_sessions ADD COLUMN campaign_id UUID REFERENCES rpg_campaigns(id) ON DELETE SET NULL;
          CREATE INDEX IF NOT EXISTS rpg_sessions_campaign_idx ON rpg_sessions(campaign_id);
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS rpg_characters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        session_id UUID NOT NULL REFERENCES rpg_sessions(id) ON DELETE CASCADE,
        player_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        attributes JSONB NOT NULL DEFAULT '{}',
        resources JSONB NOT NULL DEFAULT '{}',
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS rpg_actions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        session_id UUID NOT NULL REFERENCES rpg_sessions(id) ON DELETE CASCADE,
        character_id UUID REFERENCES rpg_characters(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        dice JSONB NOT NULL DEFAULT '{}',
        outcome VARCHAR(50),
        narrative JSONB NOT NULL DEFAULT '{}',
        mechanics JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS rpg_memory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        session_id UUID NOT NULL REFERENCES rpg_sessions(id) ON DELETE CASCADE,
        campaign_id UUID REFERENCES rpg_campaigns(id) ON DELETE CASCADE,
        key VARCHAR(255) NOT NULL,
        value TEXT NOT NULL,
        type memory_type NOT NULL DEFAULT 'general',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'rpg_memory' AND column_name = 'type' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE rpg_memory ALTER COLUMN type DROP DEFAULT;
          ALTER TABLE rpg_memory ALTER COLUMN type TYPE memory_type USING 
            CASE 
              WHEN type = 'canonical' THEN 'canonical'::memory_type
              WHEN type = 'improvised' THEN 'improvised'::memory_type
              ELSE 'general'::memory_type
            END;
          ALTER TABLE rpg_memory ALTER COLUMN type SET DEFAULT 'general';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'rpg_memory' AND column_name = 'campaign_id'
        ) THEN
          ALTER TABLE rpg_memory ADD COLUMN campaign_id UUID REFERENCES rpg_campaigns(id) ON DELETE CASCADE;
        END IF;
      END $$;
      
      CREATE INDEX IF NOT EXISTS rpg_memory_campaign_idx ON rpg_memory(campaign_id);
      CREATE INDEX IF NOT EXISTS rpg_memory_type_idx ON rpg_memory(type);

      CREATE TABLE IF NOT EXISTS rpg_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        session_id UUID NOT NULL REFERENCES rpg_sessions(id) ON DELETE CASCADE,
        prompt_id VARCHAR(255),
        image_url TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS rpg_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        session_id UUID NOT NULL REFERENCES rpg_sessions(id) ON DELETE CASCADE,
        summary TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        metadata JSONB NOT NULL DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS rpg_session_masters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        session_id UUID NOT NULL REFERENCES rpg_sessions(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        is_original_creator BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS rpg_locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        campaign_id UUID NOT NULL REFERENCES rpg_campaigns(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type location_type NOT NULL,
        description TEXT,
        content JSONB NOT NULL DEFAULT '{}',
        metadata JSONB NOT NULL DEFAULT '{}',
        coordinates JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS rpg_custom_classes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        campaign_id UUID NOT NULL REFERENCES rpg_campaigns(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        base_class VARCHAR(100),
        features JSONB NOT NULL DEFAULT '{}',
        hit_die INTEGER,
        proficiencies JSONB NOT NULL DEFAULT '{}',
        spellcasting JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ Tables created/verified');

    await client.query(`
      CREATE INDEX IF NOT EXISTS rpg_sessions_tenant_idx ON rpg_sessions(tenant_id);
      CREATE INDEX IF NOT EXISTS rpg_sessions_user_idx ON rpg_sessions(user_id);
      CREATE INDEX IF NOT EXISTS rpg_sessions_room_code_idx ON rpg_sessions(room_code);
      CREATE INDEX IF NOT EXISTS rpg_characters_session_idx ON rpg_characters(session_id);
      CREATE INDEX IF NOT EXISTS rpg_characters_player_idx ON rpg_characters(player_id);
      CREATE INDEX IF NOT EXISTS rpg_actions_session_idx ON rpg_actions(session_id);
      CREATE INDEX IF NOT EXISTS rpg_actions_character_idx ON rpg_actions(character_id);
      CREATE INDEX IF NOT EXISTS rpg_session_masters_session_idx ON rpg_session_masters(session_id);
      CREATE INDEX IF NOT EXISTS rpg_session_masters_user_idx ON rpg_session_masters(user_id);
      CREATE INDEX IF NOT EXISTS rpg_memory_session_idx ON rpg_memory(session_id);
      CREATE INDEX IF NOT EXISTS rpg_memory_key_idx ON rpg_memory(key);
      CREATE INDEX IF NOT EXISTS rpg_images_session_idx ON rpg_images(session_id);
      CREATE INDEX IF NOT EXISTS rpg_history_session_idx ON rpg_history(session_id);
      CREATE INDEX IF NOT EXISTS rpg_locations_campaign_idx ON rpg_locations(campaign_id);
      CREATE INDEX IF NOT EXISTS rpg_locations_type_idx ON rpg_locations(type);
      CREATE INDEX IF NOT EXISTS rpg_locations_name_idx ON rpg_locations(name);
      CREATE INDEX IF NOT EXISTS rpg_custom_classes_campaign_idx ON rpg_custom_classes(campaign_id);
      CREATE INDEX IF NOT EXISTS rpg_custom_classes_base_class_idx ON rpg_custom_classes(base_class);
      CREATE INDEX IF NOT EXISTS rpg_custom_classes_name_idx ON rpg_custom_classes(name);
    `);
    console.log('✅ Indexes created/verified');

    await client.query(`
      CREATE TABLE IF NOT EXISTS dnd_classes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        index VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        synced_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS dnd_monsters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        index VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        synced_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS dnd_spells (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        index VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        synced_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS dnd_equipment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        index VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        synced_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS dnd_races (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        index VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        synced_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS dnd_magic_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        index VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        synced_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS dnd_feats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        index VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        synced_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS dnd_backgrounds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        index VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        synced_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS dnd_subclasses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        index VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        synced_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS dnd_subraces (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        index VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        synced_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS dnd_sync_control (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        category VARCHAR(255) NOT NULL UNIQUE,
        last_synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        message TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS dnd_languages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        index VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        synced_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS dnd_magic_schools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        index VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        synced_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS dnd_proficiencies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        index VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        synced_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ D&D 5e tables created/verified');

    await client.query(`
      CREATE INDEX IF NOT EXISTS dnd_classes_index_idx ON dnd_classes(index);
      CREATE INDEX IF NOT EXISTS dnd_classes_name_idx ON dnd_classes(name);
      CREATE INDEX IF NOT EXISTS dnd_monsters_index_idx ON dnd_monsters(index);
      CREATE INDEX IF NOT EXISTS dnd_monsters_name_idx ON dnd_monsters(name);
      CREATE INDEX IF NOT EXISTS dnd_spells_index_idx ON dnd_spells(index);
      CREATE INDEX IF NOT EXISTS dnd_spells_name_idx ON dnd_spells(name);
      CREATE INDEX IF NOT EXISTS dnd_equipment_index_idx ON dnd_equipment(index);
      CREATE INDEX IF NOT EXISTS dnd_equipment_name_idx ON dnd_equipment(name);
      CREATE INDEX IF NOT EXISTS dnd_races_index_idx ON dnd_races(index);
      CREATE INDEX IF NOT EXISTS dnd_races_name_idx ON dnd_races(name);
      CREATE INDEX IF NOT EXISTS dnd_magic_items_index_idx ON dnd_magic_items(index);
      CREATE INDEX IF NOT EXISTS dnd_magic_items_name_idx ON dnd_magic_items(name);
      CREATE INDEX IF NOT EXISTS dnd_feats_index_idx ON dnd_feats(index);
      CREATE INDEX IF NOT EXISTS dnd_feats_name_idx ON dnd_feats(name);
      CREATE INDEX IF NOT EXISTS dnd_backgrounds_index_idx ON dnd_backgrounds(index);
      CREATE INDEX IF NOT EXISTS dnd_backgrounds_name_idx ON dnd_backgrounds(name);
      CREATE INDEX IF NOT EXISTS dnd_subclasses_index_idx ON dnd_subclasses(index);
      CREATE INDEX IF NOT EXISTS dnd_subclasses_name_idx ON dnd_subclasses(name);
      CREATE INDEX IF NOT EXISTS dnd_subraces_index_idx ON dnd_subraces(index);
      CREATE INDEX IF NOT EXISTS dnd_subraces_name_idx ON dnd_subraces(name);
      CREATE INDEX IF NOT EXISTS dnd_languages_index_idx ON dnd_languages(index);
      CREATE INDEX IF NOT EXISTS dnd_languages_name_idx ON dnd_languages(name);
      CREATE INDEX IF NOT EXISTS dnd_magic_schools_index_idx ON dnd_magic_schools(index);
      CREATE INDEX IF NOT EXISTS dnd_magic_schools_name_idx ON dnd_magic_schools(name);
      CREATE INDEX IF NOT EXISTS dnd_proficiencies_index_idx ON dnd_proficiencies(index);
      CREATE INDEX IF NOT EXISTS dnd_proficiencies_name_idx ON dnd_proficiencies(name);
      CREATE INDEX IF NOT EXISTS dnd_sync_control_category_idx ON dnd_sync_control(category);
    `);
    console.log('✅ D&D 5e indexes created/verified');

    console.log('\n✅ RPG service schema ensured successfully!');
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
