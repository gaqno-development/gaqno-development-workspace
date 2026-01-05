import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { NarratorService } from './narrator.service';
import { ImageService, ImageGenerationRequest } from './image.service';
import { NarrateActionDto } from './dto/narrate-action.dto';

@Controller('narrator')
export class NarratorController {
  constructor(
    private readonly narratorService: NarratorService,
    private readonly imageService: ImageService
  ) {}

  @Post('narrate')
  async narrateAction(@Body() dto: NarrateActionDto) {
    const sessionId = dto.player_id;
    return this.narratorService.narrateAction(dto, sessionId);
  }

  @Post('generate-image')
  async generateImage(@Body() request: ImageGenerationRequest) {
    return this.imageService.generateImage(request);
  }
}

