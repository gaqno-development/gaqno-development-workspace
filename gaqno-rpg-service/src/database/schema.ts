import { pgTable, uuid, varchar, timestamp, text, jsonb, pgEnum, index, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const sessionStatusEnum = pgEnum('session_status', ['draft', 'active', 'paused', 'completed', 'archived']);
export const campaignStatusEnum = pgEnum('campaign_status', ['draft', 'active', 'archived']);
export const memoryTypeEnum = pgEnum('memory_type', ['general', 'canonical', 'improvised']);

export const rpgCampaigns = pgTable('rpg_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id'),
  userId: uuid('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  concept: jsonb('concept'),
  world: jsonb('world'),
  initialNarrative: jsonb('initial_narrative'),
  npcs: jsonb('npcs').notNull().default('[]'),
  hooks: jsonb('hooks').notNull().default('[]'),
  isPublic: boolean('is_public').notNull().default(false),
  status: campaignStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  tenantIdx: index('rpg_campaigns_tenant_idx').on(table.tenantId),
  userIdx: index('rpg_campaigns_user_idx').on(table.userId),
  publicIdx: index('rpg_campaigns_public_idx').on(table.isPublic)
}));

export const rpgSessions = pgTable('rpg_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id'),
  userId: uuid('user_id').notNull(),
  campaignId: uuid('campaign_id').references(() => rpgCampaigns.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: sessionStatusEnum('status').notNull().default('draft'),
  roomCode: varchar('room_code', { length: 10 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  tenantIdx: index('rpg_sessions_tenant_idx').on(table.tenantId),
  userIdx: index('rpg_sessions_user_idx').on(table.userId),
  campaignIdx: index('rpg_sessions_campaign_idx').on(table.campaignId),
  roomCodeIdx: index('rpg_sessions_room_code_idx').on(table.roomCode)
}));

export const rpgCharacters = pgTable('rpg_characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => rpgSessions.id, { onDelete: 'cascade' }),
  playerId: uuid('player_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  attributes: jsonb('attributes').notNull().default({}),
  resources: jsonb('resources').notNull().default({}),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  sessionIdx: index('rpg_characters_session_idx').on(table.sessionId),
  playerIdx: index('rpg_characters_player_idx').on(table.playerId)
}));

export const rpgActions = pgTable('rpg_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => rpgSessions.id, { onDelete: 'cascade' }),
  characterId: uuid('character_id').references(() => rpgCharacters.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  dice: jsonb('dice').notNull().default({}),
  outcome: varchar('outcome', { length: 50 }),
  narrative: jsonb('narrative').notNull().default({}),
  mechanics: jsonb('mechanics').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  sessionIdx: index('rpg_actions_session_idx').on(table.sessionId),
  characterIdx: index('rpg_actions_character_idx').on(table.characterId)
}));

export const rpgMemory = pgTable('rpg_memory', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => rpgSessions.id, { onDelete: 'cascade' }),
  campaignId: uuid('campaign_id').references(() => rpgCampaigns.id, { onDelete: 'cascade' }),
  key: varchar('key', { length: 255 }).notNull(),
  value: text('value').notNull(),
  type: memoryTypeEnum('type').notNull().default('general'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  sessionIdx: index('rpg_memory_session_idx').on(table.sessionId),
  campaignIdx: index('rpg_memory_campaign_idx').on(table.campaignId),
  keyIdx: index('rpg_memory_key_idx').on(table.key),
  typeIdx: index('rpg_memory_type_idx').on(table.type)
}));

export const rpgImages = pgTable('rpg_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => rpgSessions.id, { onDelete: 'cascade' }),
  promptId: varchar('prompt_id', { length: 255 }),
  imageUrl: text('image_url').notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  sessionIdx: index('rpg_images_session_idx').on(table.sessionId)
}));

export const rpgHistory = pgTable('rpg_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => rpgSessions.id, { onDelete: 'cascade' }),
  summary: text('summary').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  metadata: jsonb('metadata').notNull().default({})
}, (table) => ({
  sessionIdx: index('rpg_history_session_idx').on(table.sessionId)
}));

export const campaignsRelations = relations(rpgCampaigns, ({ one, many }) => ({
  sessions: many(rpgSessions),
  memory: many(rpgMemory),
  locations: many(rpgLocations),
  customClasses: many(rpgCustomClasses)
}));

export const sessionsRelations = relations(rpgSessions, ({ one, many }) => ({
  campaign: one(rpgCampaigns, {
    fields: [rpgSessions.campaignId],
    references: [rpgCampaigns.id]
  }),
  characters: many(rpgCharacters),
  actions: many(rpgActions),
  memory: many(rpgMemory),
  images: many(rpgImages),
  history: many(rpgHistory)
}));

export const charactersRelations = relations(rpgCharacters, ({ one, many }) => ({
  session: one(rpgSessions, {
    fields: [rpgCharacters.sessionId],
    references: [rpgSessions.id]
  }),
  actions: many(rpgActions)
}));

export const rpgSessionMasters = pgTable('rpg_session_masters', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => rpgSessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  isOriginalCreator: boolean('is_original_creator').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  sessionIdx: index('rpg_session_masters_session_idx').on(table.sessionId),
  userIdx: index('rpg_session_masters_user_idx').on(table.userId)
}));

export const entityTypeEnum = pgEnum('entity_type', ['npc', 'location', 'item', 'event', 'organization', 'concept']);
export const locationTypeEnum = pgEnum('location_type', ['dungeon', 'city', 'region', 'landmark', 'building']);

export const rpgCodexEntries = pgTable('rpg_codex_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => rpgCampaigns.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id').references(() => rpgSessions.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  embedding: jsonb('embedding'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  campaignIdx: index('rpg_codex_campaign_idx').on(table.campaignId),
  sessionIdx: index('rpg_codex_session_idx').on(table.sessionId)
}));

export const rpgBibleEntities = pgTable('rpg_bible_entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => rpgCampaigns.id, { onDelete: 'cascade' }),
  type: entityTypeEnum('type').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  content: jsonb('content').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  campaignIdx: index('rpg_bible_campaign_idx').on(table.campaignId),
  typeIdx: index('rpg_bible_type_idx').on(table.type),
  nameIdx: index('rpg_bible_name_idx').on(table.name)
}));

export const rpgBibleLinks = pgTable('rpg_bible_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromEntityId: uuid('from_entity_id').notNull().references(() => rpgBibleEntities.id, { onDelete: 'cascade' }),
  toEntityId: uuid('to_entity_id').notNull().references(() => rpgBibleEntities.id, { onDelete: 'cascade' }),
  relationship: varchar('relationship', { length: 100 }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  fromIdx: index('rpg_bible_links_from_idx').on(table.fromEntityId),
  toIdx: index('rpg_bible_links_to_idx').on(table.toEntityId),
  relationshipIdx: index('rpg_bible_links_relationship_idx').on(table.relationship)
}));

export const rpgBibleVersions = pgTable('rpg_bible_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull().references(() => rpgBibleEntities.id, { onDelete: 'cascade' }),
  content: jsonb('content').notNull(),
  version: integer('version').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  entityIdx: index('rpg_bible_versions_entity_idx').on(table.entityId),
  versionIdx: index('rpg_bible_versions_version_idx').on(table.version)
}));

export const rpgLocations = pgTable('rpg_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => rpgCampaigns.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: locationTypeEnum('type').notNull(),
  description: text('description'),
  content: jsonb('content').notNull().default('{}'),
  metadata: jsonb('metadata').notNull().default('{}'),
  coordinates: jsonb('coordinates'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  campaignIdx: index('rpg_locations_campaign_idx').on(table.campaignId),
  typeIdx: index('rpg_locations_type_idx').on(table.type),
  nameIdx: index('rpg_locations_name_idx').on(table.name)
}));

export const rpgCustomClasses = pgTable('rpg_custom_classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => rpgCampaigns.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  baseClass: varchar('base_class', { length: 100 }),
  features: jsonb('features').notNull().default('{}'),
  hitDie: integer('hit_die'),
  proficiencies: jsonb('proficiencies').notNull().default('{}'),
  spellcasting: jsonb('spellcasting'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  campaignIdx: index('rpg_custom_classes_campaign_idx').on(table.campaignId),
  baseClassIdx: index('rpg_custom_classes_base_class_idx').on(table.baseClass),
  nameIdx: index('rpg_custom_classes_name_idx').on(table.name)
}));

export const dndClasses = pgTable('dnd_classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  index: varchar('index', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  data: jsonb('data').notNull().default('{}'),
  syncedAt: timestamp('synced_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  indexIdx: index('dnd_classes_index_idx').on(table.index),
  nameIdx: index('dnd_classes_name_idx').on(table.name)
}));

export const dndMonsters = pgTable('dnd_monsters', {
  id: uuid('id').primaryKey().defaultRandom(),
  index: varchar('index', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  data: jsonb('data').notNull().default('{}'),
  syncedAt: timestamp('synced_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  indexIdx: index('dnd_monsters_index_idx').on(table.index),
  nameIdx: index('dnd_monsters_name_idx').on(table.name)
}));

export const dndSpells = pgTable('dnd_spells', {
  id: uuid('id').primaryKey().defaultRandom(),
  index: varchar('index', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  data: jsonb('data').notNull().default('{}'),
  syncedAt: timestamp('synced_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  indexIdx: index('dnd_spells_index_idx').on(table.index),
  nameIdx: index('dnd_spells_name_idx').on(table.name)
}));

export const dndEquipment = pgTable('dnd_equipment', {
  id: uuid('id').primaryKey().defaultRandom(),
  index: varchar('index', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  data: jsonb('data').notNull().default('{}'),
  syncedAt: timestamp('synced_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  indexIdx: index('dnd_equipment_index_idx').on(table.index),
  nameIdx: index('dnd_equipment_name_idx').on(table.name)
}));

export const dndRaces = pgTable('dnd_races', {
  id: uuid('id').primaryKey().defaultRandom(),
  index: varchar('index', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  data: jsonb('data').notNull().default('{}'),
  syncedAt: timestamp('synced_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  indexIdx: index('dnd_races_index_idx').on(table.index),
  nameIdx: index('dnd_races_name_idx').on(table.name)
}));

export const dndMagicItems = pgTable('dnd_magic_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  index: varchar('index', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  data: jsonb('data').notNull().default('{}'),
  syncedAt: timestamp('synced_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  indexIdx: index('dnd_magic_items_index_idx').on(table.index),
  nameIdx: index('dnd_magic_items_name_idx').on(table.name)
}));

export const dndFeats = pgTable('dnd_feats', {
  id: uuid('id').primaryKey().defaultRandom(),
  index: varchar('index', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  data: jsonb('data').notNull().default('{}'),
  syncedAt: timestamp('synced_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  indexIdx: index('dnd_feats_index_idx').on(table.index),
  nameIdx: index('dnd_feats_name_idx').on(table.name)
}));

export const dndBackgrounds = pgTable('dnd_backgrounds', {
  id: uuid('id').primaryKey().defaultRandom(),
  index: varchar('index', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  data: jsonb('data').notNull().default('{}'),
  syncedAt: timestamp('synced_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  indexIdx: index('dnd_backgrounds_index_idx').on(table.index),
  nameIdx: index('dnd_backgrounds_name_idx').on(table.name)
}));

export const dndSubclasses = pgTable('dnd_subclasses', {
  id: uuid('id').primaryKey().defaultRandom(),
  index: varchar('index', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  data: jsonb('data').notNull().default('{}'),
  syncedAt: timestamp('synced_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  indexIdx: index('dnd_subclasses_index_idx').on(table.index),
  nameIdx: index('dnd_subclasses_name_idx').on(table.name)
}));

export const dndSubraces = pgTable('dnd_subraces', {
  id: uuid('id').primaryKey().defaultRandom(),
  index: varchar('index', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  data: jsonb('data').notNull().default('{}'),
  syncedAt: timestamp('synced_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  indexIdx: index('dnd_subraces_index_idx').on(table.index),
  nameIdx: index('dnd_subraces_name_idx').on(table.name)
}));

export const dndLanguages = pgTable('dnd_languages', {
  id: uuid('id').primaryKey().defaultRandom(),
  index: varchar('index', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  data: jsonb('data').notNull().default('{}'),
  syncedAt: timestamp('synced_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  indexIdx: index('dnd_languages_index_idx').on(table.index),
  nameIdx: index('dnd_languages_name_idx').on(table.name)
}));

export const dndMagicSchools = pgTable('dnd_magic_schools', {
  id: uuid('id').primaryKey().defaultRandom(),
  index: varchar('index', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  data: jsonb('data').notNull().default('{}'),
  syncedAt: timestamp('synced_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  indexIdx: index('dnd_magic_schools_index_idx').on(table.index),
  nameIdx: index('dnd_magic_schools_name_idx').on(table.name)
}));

export const dndProficiencies = pgTable('dnd_proficiencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  index: varchar('index', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  data: jsonb('data').notNull().default('{}'),
  syncedAt: timestamp('synced_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  indexIdx: index('dnd_proficiencies_index_idx').on(table.index),
  nameIdx: index('dnd_proficiencies_name_idx').on(table.name)
}));

export const dndApiSync = pgTable('dnd_api_sync', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: varchar('category', { length: 100 }).notNull().unique(),
  lastSyncedAt: timestamp('last_synced_at'),
  version: varchar('version', { length: 50 }),
  itemCount: integer('item_count').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  categoryIdx: index('dnd_api_sync_category_idx').on(table.category)
}));

