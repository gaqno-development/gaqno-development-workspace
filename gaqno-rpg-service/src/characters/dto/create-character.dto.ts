import { IsString, IsObject, IsOptional } from 'class-validator';

export class CreateCharacterDto {
  @IsString()
  sessionId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;

  @IsOptional()
  @IsObject()
  resources?: Record<string, any>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

