import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  campaignId?: string;
}

