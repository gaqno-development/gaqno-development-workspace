import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DatabaseService } from '../database/db.service';
import {
  dndClasses,
  dndMonsters,
  dndSpells,
  dndEquipment,
  dndRaces,
  dndMagicItems,
  dndFeats,
  dndBackgrounds,
  dndSubclasses,
  dndSubraces,
  dndLanguages,
  dndMagicSchools,
  dndProficiencies,
  dndApiSync,
} from '../database/schema';
import { eq, and, gte, lte, sql, like } from 'drizzle-orm';

const DND_API_BASE_URL = 'https://www.dnd5eapi.co/api/2014';

const CATEGORY_TABLE_MAP: Record<string, any> = {
  classes: dndClasses,
  monsters: dndMonsters,
  spells: dndSpells,
  equipment: dndEquipment,
  races: dndRaces,
  'magic-items': dndMagicItems,
  feats: dndFeats,
  backgrounds: dndBackgrounds,
  subclasses: dndSubclasses,
  subraces: dndSubraces,
  languages: dndLanguages,
  'magic-schools': dndMagicSchools,
  proficiencies: dndProficiencies,
};

export interface SearchAllCategoriesResult {
  query: string;
  results: Record<string, { items: Array<{ name: string; index: string }>; count: number }>;
  total_count: number;
  top_results?: Array<{ category: string; name: string; index: string }>;
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
export class Dnd5eService {
  private readonly logger = new Logger(Dnd5eService.name);
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private readonly CACHE_TTL = 3600000;

  constructor(
    private readonly httpService: HttpService,
    private readonly db: DatabaseService,
  ) {}

  private async fetchFromApi<T>(url: string): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<T>(url, {
          timeout: 15000,
          maxRedirects: 5,
          headers: {
            'Accept': 'application/json',
          },
        }),
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        const notFoundError = new Error('NOT_FOUND');
        (notFoundError as any).statusCode = 404;
        throw notFoundError;
      }
      this.logger.error(`Error fetching from API: ${url}`, error?.message || error);
      const apiError = new Error(`API_ERROR: ${error?.message || 'Unknown error'}`);
      (apiError as any).statusCode = error?.response?.status || 500;
      throw apiError;
    }
  }

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data as T;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.CACHE_TTL,
    });
  }

  async getCategories(): Promise<Record<string, string>> {
    const cacheKey = 'categories';
    const cached = this.getCached<Record<string, string>>(cacheKey);
    if (cached) return cached;

    const data = await this.fetchFromApi<Record<string, string>>(`${DND_API_BASE_URL}/`);
    this.setCache(cacheKey, data);
    return data;
  }

  async getCategoryList(
    category: string,
    offset?: number,
    limit?: number,
  ): Promise<{ count: number; results: Array<{ index: string; name: string; url: string }>; offset?: number; limit?: number; hasMore?: boolean }> {
    const cacheKey = `category_list_${category}`;
    const cached = this.getCached<{ count: number; results: Array<{ index: string; name: string; url: string }> }>(cacheKey);
    
    let fullData: { count: number; results: Array<{ index: string; name: string; url: string }> };
    
    if (cached) {
      fullData = cached;
    } else {
      try {
        const data = await this.fetchFromApi<{ count: number; results: Array<{ index: string; name: string; url: string }> }>(
          `${DND_API_BASE_URL}/${category}`,
        );
        this.setCache(cacheKey, data);
        fullData = data;
      } catch (error: any) {
        if (error.message === 'NOT_FOUND') {
          throw error;
        }
        throw error;
      }
    }

    // Apply pagination if offset/limit provided
    if (offset !== undefined || limit !== undefined) {
      const start = offset || 0;
      const end = limit !== undefined ? start + limit : undefined;
      const paginatedResults = fullData.results.slice(start, end);
      
      return {
        count: fullData.count,
        results: paginatedResults,
        offset: start,
        limit: limit || paginatedResults.length,
        hasMore: end !== undefined ? end < fullData.results.length : false,
      };
    }

    return fullData;
  }

  private extractUrlsFromObject(obj: any, urls: Set<string> = new Set()): Set<string> {
    if (!obj || typeof obj !== 'object') {
      return urls;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item) => this.extractUrlsFromObject(item, urls));
      return urls;
    }

    if (obj.url && typeof obj.url === 'string' && obj.url.includes('/api/2014/')) {
      urls.add(obj.url);
    }

    Object.values(obj).forEach((value) => {
      if (value && typeof value === 'object') {
        this.extractUrlsFromObject(value, urls);
      }
    });

    return urls;
  }

  private async resolveUrl(url: string): Promise<{ category: string; index: string; data: any } | null> {
    try {
      const urlParts = url.split('/').filter((p) => p && p !== 'api' && p !== '2014');
      if (urlParts.length < 2) {
        return null;
      }

      const category = urlParts[0];
      const index = urlParts[1];

      const data = await this.getItem(category, index);
      return { category, index, data };
    } catch (error) {
      this.logger.warn(`Failed to resolve URL: ${url}`, error?.message || error);
      return null;
    }
  }

  async getItemWithResolvedReferences(category: string, index: string): Promise<any> {
    const item = await this.getItem(category, index);
    if (!item) {
      return null;
    }

    const urls = this.extractUrlsFromObject(item);
    const resolvedReferences: Record<string, any> = {};

    const resolvePromises = Array.from(urls).map(async (url) => {
      const resolved = await this.resolveUrl(url);
      if (resolved) {
        const key = `${resolved.category}:${resolved.index}`;
        resolvedReferences[key] = resolved.data;
      }
    });

    await Promise.all(resolvePromises);

    return {
      ...item,
      _resolved: resolvedReferences,
    };
  }

  async getItem(category: string, index: string): Promise<any> {
    const table = CATEGORY_TABLE_MAP[category];
    if (table) {
      try {
        const [item] = await this.db.db.select().from(table).where(eq(table.index, index)).limit(1);
        if (item) {
          return item.data;
        }
      } catch (dbError: any) {
        // Table might not exist yet - log and continue to fetch from API
        if (dbError?.message?.includes('does not exist') || dbError?.code === '42P01') {
          this.logger.warn(`Table for category ${category} does not exist yet, fetching from API: ${index}`);
        } else {
          this.logger.error(`Database error when fetching item ${category}/${index}:`, dbError?.message || dbError);
        }
        // Continue to fetch from API
      }
    }

    const cacheKey = `item_${category}_${index}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) {
      // If we have cached data but not in DB, try to save it
      if (table) {
        try {
          await this.db.db
            .insert(table)
            .values({
              index,
              name: cached.name || index,
              data: cached,
              syncedAt: new Date(),
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: table.index,
              set: {
                name: cached.name || index,
                data: cached,
                updatedAt: new Date(),
              },
            });
        } catch (error: any) {
          // Check if table doesn't exist (42P01) - this is expected before migrations run
          if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
            // Silently skip - table will be created by migrations
          } else {
            this.logger.warn(`Failed to save cached item to database: ${category}/${index}`, error?.message || error);
          }
        }
      }
      return cached;
    }

    try {
      const data = await this.fetchFromApi<any>(`${DND_API_BASE_URL}/${category}/${index}`);
      
      // Save to cache
      this.setCache(cacheKey, data);
      
      // Save to database if table exists
      if (table) {
        try {
          await this.db.db
            .insert(table)
            .values({
              index,
              name: data.name || index,
              data: data,
              syncedAt: new Date(),
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: table.index,
              set: {
                name: data.name || index,
                data: data,
                updatedAt: new Date(),
              },
            });
        } catch (dbError: any) {
          // Check if table doesn't exist (42P01) - this is expected before migrations run
          if (dbError?.code === '42P01' || dbError?.message?.includes('does not exist')) {
            this.logger.warn(`Table for category ${category} does not exist yet, skipping save: ${index}`);
          } else {
            this.logger.error(`Failed to save item to database: ${category}/${index}`, dbError?.message || dbError);
          }
          // Continue even if DB save fails - we have the data
        }
      }
      
      return data;
    } catch (error: any) {
      if (error.message === 'NOT_FOUND' || error.message?.includes('NOT_FOUND')) {
        const notFoundError = new Error('NOT_FOUND');
        (notFoundError as any).statusCode = 404;
        throw notFoundError;
      }
      this.logger.error(`Failed to fetch item from API: ${category}/${index}`, error?.message || error);
      // Re-throw with more context
      const apiError = new Error(`Failed to fetch item: ${error?.message || 'Unknown error'}`);
      (apiError as any).statusCode = error?.statusCode || 500;
      throw apiError;
    }
  }

  async getSpecialEndpoint(category: string, index: string, endpoint: string): Promise<any> {
    const cacheKey = `special_${category}_${index}_${endpoint}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const data = await this.fetchFromApi<any>(`${DND_API_BASE_URL}/${category}/${index}/${endpoint}`);
      this.setCache(cacheKey, data);
      return data;
    } catch (error: any) {
      if (error.message === 'NOT_FOUND' || error.message?.includes('NOT_FOUND')) {
        const notFoundError = new Error('NOT_FOUND');
        (notFoundError as any).statusCode = 404;
        throw notFoundError;
      }
      this.logger.error(`Failed to fetch special endpoint from API: ${category}/${index}/${endpoint}`, error?.message || error);
      const apiError = new Error(`Failed to fetch special endpoint: ${error?.message || 'Unknown error'}`);
      (apiError as any).statusCode = error?.statusCode || 500;
      throw apiError;
    }
  }

  async syncCategory(category: string): Promise<{ synced: number; errors: number }> {
    const table = CATEGORY_TABLE_MAP[category];
    if (!table) {
      throw new Error(`Unknown category: ${category}`);
    }

    this.logger.log(`Starting sync for category: ${category}`);
    const listData = await this.getCategoryList(category);
    let synced = 0;
    let errors = 0;

    for (const item of listData.results) {
      try {
        const existing = await this.db.db.select().from(table).where(eq(table.index, item.index)).limit(1);
        const cacheKey = `item_${category}_${item.index}`;
        let itemData = this.getCached<any>(cacheKey);
        if (!itemData) {
          itemData = await this.fetchFromApi<any>(`${DND_API_BASE_URL}/${category}/${item.index}`);
          this.setCache(cacheKey, itemData);
        }

        if (existing.length > 0) {
          await this.db.db
            .update(table)
            .set({
              name: item.name,
              data: itemData,
              syncedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(table.index, item.index));
        } else {
          await this.db.db.insert(table).values({
            index: item.index,
            name: item.name,
            data: itemData,
            syncedAt: new Date(),
          });
        }
        synced++;
      } catch (error) {
        this.logger.error(`Error syncing item ${item.index} in category ${category}:`, error);
        errors++;
      }
    }

    const [syncRecord] = await this.db.db
      .select()
      .from(dndApiSync)
      .where(eq(dndApiSync.category, category))
      .limit(1);

    if (syncRecord) {
      await this.db.db
        .update(dndApiSync)
        .set({
          lastSyncedAt: new Date(),
          itemCount: synced,
          updatedAt: new Date(),
        })
        .where(eq(dndApiSync.category, category));
    } else {
      await this.db.db.insert(dndApiSync).values({
        category,
        lastSyncedAt: new Date(),
        itemCount: synced,
      });
    }

    this.logger.log(`Sync completed for ${category}: ${synced} synced, ${errors} errors`);
    return { synced, errors };
  }

  async syncAll(): Promise<Record<string, { synced: number; errors: number }>> {
    const categories = Object.keys(CATEGORY_TABLE_MAP);
    const results: Record<string, { synced: number; errors: number }> = {};

    for (const category of categories) {
      try {
        results[category] = await this.syncCategory(category);
      } catch (error) {
        this.logger.error(`Error syncing category ${category}:`, error);
        results[category] = { synced: 0, errors: 0 };
      }
    }

    return results;
  }

  async searchCategory(category: string, query: string): Promise<Array<{ name: string; index: string }>> {
    const table = CATEGORY_TABLE_MAP[category];
    if (!table) {
      return [];
    }

    try {
      // Escape single quotes in the query to prevent SQL injection
      const escapedQuery = query.replace(/'/g, "''");
      const searchPattern = `%${escapedQuery}%`;
      
      // Use ILIKE for case-insensitive search in PostgreSQL
      // Use sql.raw to safely inject the pattern value
      const results = await this.db.db
        .select({ name: table.name, index: table.index })
        .from(table)
        .where(sql`${table.name} ILIKE ${sql.raw(`'${searchPattern}'`)}`)
        .limit(50);

      return results;
    } catch (error: any) {
      // Check if table doesn't exist
      if (error?.message?.includes('does not exist') || error?.code === '42P01') {
        this.logger.warn(`Table for category ${category} does not exist yet, returning empty search results`);
        return [];
      }
      
      this.logger.error(`Error searching category ${category} with query "${query}":`, error?.message || error);
      // Fallback: fetch all items and filter in memory
      try {
        const allItems = await this.db.db
          .select({ name: table.name, index: table.index })
          .from(table)
          .limit(1000);
        
        const queryLower = query.toLowerCase();
        const filtered = allItems.filter(item => 
          item.name.toLowerCase().includes(queryLower)
        );
        
        return filtered.slice(0, 50);
      } catch (fallbackError: any) {
        // If fallback also fails due to table not existing, return empty
        if (fallbackError?.message?.includes('does not exist') || fallbackError?.code === '42P01') {
          this.logger.warn(`Table for category ${category} does not exist, returning empty results`);
          return [];
        }
        this.logger.error(`Fallback search also failed for category ${category}:`, fallbackError?.message || fallbackError);
        return [];
      }
    }
  }

  async searchAllCategories(query: string): Promise<SearchAllCategoriesResult> {
    const categories = Object.keys(CATEGORY_TABLE_MAP);
    const results: Record<string, { items: Array<{ name: string; index: string }>; count: number }> = {};
    const topResults: Array<{ category: string; name: string; index: string }> = [];
    let totalCount = 0;

    for (const category of categories) {
      const items = await this.searchCategory(category, query);
      if (items.length > 0) {
        results[category] = {
          items,
          count: items.length,
        };
        totalCount += items.length;
        topResults.push(...items.slice(0, 5).map((item) => ({ category, ...item })));
      }
    }

    return {
      query,
      results,
      total_count: totalCount,
      top_results: topResults.slice(0, 20),
    };
  }

  async filterSpellsByLevel(minLevel: number = 0, maxLevel: number = 9, school?: string): Promise<FilterSpellsResult> {
    try {
      const spells = await this.db.db.select().from(dndSpells).limit(1000);
      const filtered = spells.filter((spell) => {
        const data = spell.data as any;
        const level = data.level || 0;
        if (level < minLevel || level > maxLevel) return false;
        if (school && data.school?.name?.toLowerCase() !== school.toLowerCase()) return false;
        return true;
      });

      return {
        query: `Level ${minLevel}-${maxLevel}${school ? `, School: ${school}` : ''}`,
        items: filtered.slice(0, 100).map((spell) => {
          const data = spell.data as any;
          return {
            name: spell.name,
            level: data.level || 0,
            school: data.school?.name || 'Unknown',
            casting_time: data.casting_time || 'Unknown',
            description: data.desc?.join(' ') || '',
            uri: `/api/spells/${spell.index}`,
          };
        }),
        count: filtered.length,
      };
    } catch (error: any) {
      if (error?.message?.includes('does not exist') || error?.code === '42P01') {
        this.logger.warn('dnd_spells table does not exist yet, returning empty results');
        return {
          query: `Level ${minLevel}-${maxLevel}${school ? `, School: ${school}` : ''}`,
          items: [],
          count: 0,
        };
      }
      this.logger.error('Error filtering spells by level:', error?.message || error);
      throw error;
    }
  }

  async findMonstersByCR(minCR: number = 0, maxCR: number = 30): Promise<FindMonstersResult> {
    try {
      const monsters = await this.db.db.select().from(dndMonsters).limit(1000);
      const filtered = monsters.filter((monster) => {
        const data = monster.data as any;
        const cr = parseFloat(data.challenge_rating?.toString() || '0');
        return cr >= minCR && cr <= maxCR;
      });

      return {
        query: `CR ${minCR}-${maxCR}`,
        items: filtered.slice(0, 100).map((monster) => {
          const data = monster.data as any;
          return {
            name: monster.name,
            challenge_rating: parseFloat(data.challenge_rating?.toString() || '0'),
            type: data.type || 'Unknown',
            size: data.size || 'Unknown',
            alignment: data.alignment || 'Unknown',
            hit_points: data.hit_points || 0,
            armor_class: data.armor_class?.[0]?.value || 10,
            uri: `/api/monsters/${monster.index}`,
          };
        }),
        count: filtered.length,
      };
    } catch (error: any) {
      if (error?.message?.includes('does not exist') || error?.code === '42P01') {
        this.logger.warn('dnd_monsters table does not exist yet, returning empty results');
        return {
          query: `CR ${minCR}-${maxCR}`,
          items: [],
          count: 0,
        };
      }
      this.logger.error('Error finding monsters by CR:', error?.message || error);
      throw error;
    }
  }

  async getClassStartingEquipment(className: string): Promise<ClassStartingEquipmentResult> {
    const classData = await this.getItem('classes', className.toLowerCase().replace(/\s+/g, '-'));
    if (!classData) {
      throw new Error(`Class not found: ${className}`);
    }

    return {
      class: className,
      starting_equipment: classData.starting_equipment || [],
      equipment_options: classData.starting_equipment_options || [],
    };
  }

  async generateTreasureHoard(
    challengeRating: number,
    isFinalTreasure: boolean = false,
    treasureType: 'individual' | 'hoard' = 'hoard',
  ): Promise<TreasureHoardResult> {
    const crTier = challengeRating <= 4 ? 'low' : challengeRating <= 10 ? 'medium' : challengeRating <= 16 ? 'high' : 'epic';
    
    const coins = {
      cp: Math.floor(Math.random() * 1000),
      sp: Math.floor(Math.random() * 500),
      gp: Math.floor(Math.random() * 100 * challengeRating),
      pp: Math.floor(Math.random() * 10 * challengeRating),
    };

    const equipmentItems: Array<{ name: string; value: string; description: string; category: string; uri: string }> = [];
    const magicItems: Array<{ name: string; rarity: string; description: string; uri: string }> = [];

    if (treasureType === 'hoard') {
      try {
        const equipment = await this.db.db.select().from(dndEquipment).limit(50);
        const randomEquipment = equipment[Math.floor(Math.random() * equipment.length)];
        if (randomEquipment) {
          const data = randomEquipment.data as any;
          equipmentItems.push({
            name: randomEquipment.name,
            value: data.cost?.quantity ? `${data.cost.quantity} ${data.cost.unit}` : 'Unknown',
            description: data.desc?.join(' ') || '',
            category: data.equipment_category?.name || 'Unknown',
            uri: `/api/equipment/${randomEquipment.index}`,
          });
        }
      } catch (error: any) {
        if (!error?.message?.includes('does not exist') && error?.code !== '42P01') {
          this.logger.warn('Error fetching equipment for treasure:', error?.message || error);
        }
      }

      try {
        const magicItemsList = await this.db.db.select().from(dndMagicItems).limit(50);
        if (magicItemsList.length > 0) {
          const randomMagicItem = magicItemsList[Math.floor(Math.random() * magicItemsList.length)];
          const data = randomMagicItem.data as any;
          magicItems.push({
            name: randomMagicItem.name,
            rarity: data.rarity?.name || 'Unknown',
            description: data.desc?.join(' ') || '',
            uri: `/api/magic-items/${randomMagicItem.index}`,
          });
        }
      } catch (error: any) {
        if (!error?.message?.includes('does not exist') && error?.code !== '42P01') {
          this.logger.warn('Error fetching magic items for treasure:', error?.message || error);
        }
      }
    }

    const totalValueGp = coins.gp + coins.pp * 10 + coins.sp * 0.1 + coins.cp * 0.01;

    return {
      challenge_rating: challengeRating,
      treasure_type: treasureType,
      cr_tier: crTier,
      is_final_treasure: isFinalTreasure,
      coins,
      equipment_items: equipmentItems,
      magic_items: magicItems,
      total_value_gp: totalValueGp,
      source: 'D&D 5e API (www.dnd5eapi.co)',
    };
  }

  async checkAPIHealth(): Promise<any> {
    try {
      const startTime = Date.now();
      const data = await this.getCategories();
      const responseTime = (Date.now() - startTime) / 1000;

      return {
        status: 'online',
        response_time_seconds: responseTime,
        available_endpoints: Object.keys(data),
        base_url: DND_API_BASE_URL,
        source: 'D&D 5e API Status Check',
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Failed to connect to D&D 5e API: ${error.message}`,
        source: 'D&D 5e API Status Check',
      };
    }
  }
}

