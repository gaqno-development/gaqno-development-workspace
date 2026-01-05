import { IsString, IsOptional } from 'class-validator';

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
}

