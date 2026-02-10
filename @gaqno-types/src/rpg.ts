export enum LocationType {
  DUNGEON = "dungeon",
  CITY = "city",
  REGION = "region",
  LANDMARK = "landmark",
  BUILDING = "building",
}

export enum CampaignStep {
  CONCEPT = "concept",
  WORLD = "world",
  NARRATIVE = "narrative",
  NPCS = "npcs",
  HOOKS = "hooks",
}

export type Outcome =
  | "critical_success"
  | "success"
  | "partial"
  | "failure"
  | "critical_failure";

export interface DiceResult {
  roll: number;
  formula: string;
  target?: number;
  natural: number;
}

export interface Narrative {
  level: string;
  text: string;
}

export interface NarrativeVariant {
  level: string;
  variants: string[];
}

export interface Mechanics {
  hp_change?: number;
  damage?: number;
  healing?: number;
  damageType?: string;
  xp_gain?: number;
  resources?: Record<string, number>;
  status_effects_added?: string[];
  status_effects_removed?: string[];
}

export interface ImagePrompt {
  id: string;
  prompt: string;
  style: string;
  aspect_ratio: string;
  negative_tags: string[];
}

export interface UIAction {
  type: string;
  name: string;
  duration_ms: number;
  target?: string;
  priority: "alta" | "média" | "baixa";
  message?: string;
}

export interface CharacterSheet {
  id: string;
  attributes?: Record<string, number>;
  resources?: Record<string, number>;
}

export interface MemoryUpdate {
  key: string;
  value: string;
  replace: boolean;
}

export interface HistoryEntry {
  summary: string;
  timestamp: string;
}

export interface LocationContext {
  city?: string;
  terrain?: string;
  environment?: string;
  description?: string;
  coordinates?: {
    x?: number;
    y?: number;
    z?: number;
  };
  [key: string]: unknown;
}

export interface BattleMonsterData {
  index: string;
  name: string;
  hit_points: number;
  armor_class: number;
  challenge_rating: number;
  type: string;
  size: string;
  image?: string;
}

export interface NarratorResponseContext {
  location?: string;
  npc?: string;
  target_dc?: string;
  eventType?: string;
  monster?: BattleMonsterData;
  monsters?: BattleMonsterData[];
  masterEvent?: boolean;
  userMessageId?: string;
  userMessage?: string;
  characterName?: string;
  actionId?: string;
  timestamp?: string;
  submittedBy?: string;
  [key: string]: unknown;
}

export interface NarratorResponse {
  outcome: Outcome;
  dice: DiceResult;
  narratives: Narrative[];
  mechanics: Mechanics;
  image_prompts?: ImagePrompt[];
  ui_actions?: UIAction[];
  updated_character_sheet?: CharacterSheet;
  history_entry?: HistoryEntry;
  memory_updates?: MemoryUpdate[];
  locationContext?: LocationContext;
  context?: NarratorResponseContext;
}

export type SessionMode = "master" | "player" | "presentation";

export interface ConnectedUser {
  userId: string;
  mode: SessionMode;
  connectedAt: string;
  characterName?: string;
  displayName?: string;
  playerName?: string;
}
