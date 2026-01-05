export type Outcome = 'critical_success' | 'success' | 'partial' | 'failure' | 'critical_failure';

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
  priority: 'alta' | 'média' | 'baixa';
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
}

export interface NarratorResponse {
  outcome: Outcome;
  dice: DiceResult;
  narratives: Narrative[];
  narrative_variants?: NarrativeVariant[];
  mechanics: Mechanics;
  image_prompts?: ImagePrompt[];
  ui_actions?: UIAction[];
  updated_character_sheet?: CharacterSheet;
  history_entry?: {
    summary: string;
    timestamp: string;
  };
  memory_updates?: MemoryUpdate[];
  gm_tips?: string[];
  next_scene_hooks?: string[];
  locationContext?: LocationContext;
  context?: {
    location?: string;
    npc?: string;
    target_dc?: string;
    [key: string]: any;
  };
}

export interface RpgSession {
  id: string;
  tenantId?: string;
  userId: string;
  campaignId?: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  roomCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface RpgCharacter {
  id: string;
  sessionId: string;
  playerId: string;
  name: string;
  attributes: Record<string, any>;
  resources: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface RpgAction {
  id: string;
  sessionId: string;
  characterId?: string;
  action: string;
  dice: DiceResult;
  outcome?: Outcome;
  narrative: NarratorResponse;
  mechanics: Mechanics;
  createdAt: string;
}

export interface RpgHistory {
  id: string;
  sessionId: string;
  summary: string;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface RpgMemory {
  id: string;
  sessionId: string;
  key: string;
  value: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface RpgImage {
  id: string;
  sessionId: string;
  promptId?: string;
  imageUrl: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export type SessionMode = 'presentation' | 'master' | 'player';

export interface DiceRollRequest {
  id: string;
  sessionId: string;
  requestedBy: string; // master userId
  requestedFor: string; // player userId
  formula: string;
  target?: number;
  context?: string; // descrição do que está sendo testado
  status: 'pending' | 'rolled' | 'submitted';
  result?: DiceResult;
  createdAt: string;
}

