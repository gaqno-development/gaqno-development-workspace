import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface SearchAllCategoriesResult {
  query: string;
  enhanced_query?: string;
  results: Record<string, { items: Array<{ name: string; index: string; score?: number }>; count: number }>;
  total_count: number;
  top_results?: Array<{ category: string; name: string; index: string; score: number }>;
}

export interface FilterSpellsResult {
  query: string;
  items: Array<{
    name: string;
    level: number;
    school: string;
    casting_time: string;
    description: string;
    uri: string;
  }>;
  count: number;
}

export interface FindMonstersResult {
  query: string;
  items: Array<{
    name: string;
    challenge_rating: number;
    type: string;
    size: string;
    alignment: string;
    hit_points: number;
    armor_class: number;
    uri: string;
  }>;
  count: number;
}

export interface ClassStartingEquipmentResult {
  class: string;
  starting_equipment: Array<{ name: string; quantity: number }>;
  equipment_options: Array<{ description: string; choices: Array<{ name: string; quantity: number }> }>;
}

export interface VerifyWithAPIResult {
  statement: string;
  enhanced_statement?: string;
  search_terms: string[];
  results: Record<string, Array<{ name: string; details: any }>>;
  found_matches: boolean;
}

export interface TreasureHoardResult {
  challenge_rating: number;
  treasure_type: string;
  cr_tier: string;
  is_final_treasure: boolean;
  coins: { cp: number; sp: number; gp: number; pp: number };
  equipment_items: Array<{ name: string; value: string; description: string; category: string; uri: string }>;
  magic_items: Array<{ name: string; rarity: string; description: string; uri: string }>;
  total_value_gp: number;
  source: string;
}

@Injectable()
export class McpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(McpService.name);
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const mcpPath = process.env.DND_MCP_PATH || '/home/kursk/.local/bin/uv';
      const mcpDir = process.env.DND_MCP_DIR || '/home/kursk/coding/gaqno_server/dnd-mcp';

      this.transport = new StdioClientTransport({
        command: mcpPath,
        args: [
          'run',
          '--directory',
          mcpDir,
          'python',
          'dnd_mcp_server.py'
        ],
        env: process.env
      });

      this.client = new Client({
        name: 'gaqno-rpg-service',
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      await this.client.connect(this.transport);
      this.logger.log('Connected to D&D MCP server');
    } catch (error) {
      this.logger.error(`Failed to connect to MCP server: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
      }
      if (this.transport) {
        await this.transport.close();
        this.transport = null;
      }
    } catch (error) {
      this.logger.error(`Error disconnecting from MCP server: ${error.message}`);
    }
  }

  private async ensureConnected() {
    if (!this.client) {
      await this.connect();
    }
  }

  async searchAllCategories(query: string): Promise<SearchAllCategoriesResult> {
    await this.ensureConnected();
    try {
      const result = await this.client.callTool({
        name: 'search_all_categories',
        arguments: { query }
      });
      return result.content[0].text ? JSON.parse(result.content[0].text) : result.content[0];
    } catch (error) {
      this.logger.error(`Error calling search_all_categories: ${error.message}`, error.stack);
      throw error;
    }
  }

  async filterSpellsByLevel(minLevel: number = 0, maxLevel: number = 9, school?: string): Promise<FilterSpellsResult> {
    await this.ensureConnected();
    try {
      const args: any = { min_level: minLevel, max_level: maxLevel };
      if (school) {
        args.school = school;
      }
      const result = await this.client.callTool({
        name: 'filter_spells_by_level',
        arguments: args
      });
      return result.content[0].text ? JSON.parse(result.content[0].text) : result.content[0];
    } catch (error) {
      this.logger.error(`Error calling filter_spells_by_level: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findMonstersByCR(minCR: number = 0, maxCR: number = 30): Promise<FindMonstersResult> {
    await this.ensureConnected();
    try {
      const result = await this.client.callTool({
        name: 'find_monsters_by_challenge_rating',
        arguments: { min_cr: minCR, max_cr: maxCR }
      });
      return result.content[0].text ? JSON.parse(result.content[0].text) : result.content[0];
    } catch (error) {
      this.logger.error(`Error calling find_monsters_by_challenge_rating: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getClassStartingEquipment(className: string): Promise<ClassStartingEquipmentResult> {
    await this.ensureConnected();
    try {
      const result = await this.client.callTool({
        name: 'get_class_starting_equipment',
        arguments: { class_name: className }
      });
      return result.content[0].text ? JSON.parse(result.content[0].text) : result.content[0];
    } catch (error) {
      this.logger.error(`Error calling get_class_starting_equipment: ${error.message}`, error.stack);
      throw error;
    }
  }

  async verifyWithAPI(statement: string, category?: string): Promise<VerifyWithAPIResult> {
    await this.ensureConnected();
    try {
      const args: any = { statement };
      if (category) {
        args.category = category;
      }
      const result = await this.client.callTool({
        name: 'verify_with_api',
        arguments: args
      });
      return result.content[0].text ? JSON.parse(result.content[0].text) : result.content[0];
    } catch (error) {
      this.logger.error(`Error calling verify_with_api: ${error.message}`, error.stack);
      throw error;
    }
  }

  async generateTreasureHoard(
    challengeRating: number,
    isFinalTreasure: boolean = false,
    treasureType: 'individual' | 'hoard' = 'hoard'
  ): Promise<TreasureHoardResult> {
    await this.ensureConnected();
    try {
      const result = await this.client.callTool({
        name: 'generate_treasure_hoard',
        arguments: {
          challenge_rating: challengeRating,
          is_final_treasure: isFinalTreasure,
          treasure_type: treasureType
        }
      });
      return result.content[0].text ? JSON.parse(result.content[0].text) : result.content[0];
    } catch (error) {
      this.logger.error(`Error calling generate_treasure_hoard: ${error.message}`, error.stack);
      throw error;
    }
  }

  async checkAPIHealth(): Promise<any> {
    await this.ensureConnected();
    try {
      const result = await this.client.callTool({
        name: 'check_api_health',
        arguments: {}
      });
      return result.content[0].text ? JSON.parse(result.content[0].text) : result.content[0];
    } catch (error) {
      this.logger.error(`Error calling check_api_health: ${error.message}`, error.stack);
      throw error;
    }
  }
}

