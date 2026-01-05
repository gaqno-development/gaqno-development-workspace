import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { AuthenticatedRequest } from '../types/request.types';

@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Post()
  async createCharacter(@Req() req: AuthenticatedRequest, @Body() dto: CreateCharacterDto) {
    const tenantId = req.user?.tenantId || null;
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.charactersService.createCharacter(tenantId, userId, dto);
  }

  @Get()
  async getCharacters(@Req() req: AuthenticatedRequest, @Query('sessionId') sessionId: string) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    if (!sessionId) {
      throw new Error('sessionId is required');
    }
    return this.charactersService.getCharactersBySession(sessionId, userId);
  }

  @Get(':id')
  async getCharacterById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.charactersService.getCharacterById(id, userId);
  }

  @Patch(':id')
  async updateCharacter(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCharacterDto
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.charactersService.updateCharacter(id, userId, dto);
  }

  @Delete(':id')
  async deleteCharacter(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.charactersService.deleteCharacter(id, userId);
  }
}

