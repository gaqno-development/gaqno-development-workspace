import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateSubcategoryDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

