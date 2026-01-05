import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateSubcategoryDto {
  @IsUUID()
  parent_category_id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

