import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class SyncCategoryDto {
  @IsString()
  category: string;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

