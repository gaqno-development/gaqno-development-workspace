import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TransactionType } from './create-category.dto';

export class UpdateCategoryDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

