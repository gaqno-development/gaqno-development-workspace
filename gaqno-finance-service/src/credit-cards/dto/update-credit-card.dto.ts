import { IsString, IsNumber, IsInt, IsOptional, IsUUID } from 'class-validator';

export class UpdateCreditCardDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  last_four_digits?: string;

  @IsOptional()
  @IsString()
  card_type?: string;

  @IsOptional()
  @IsString()
  bank_name?: string;

  @IsOptional()
  @IsNumber()
  credit_limit?: number;

  @IsOptional()
  @IsInt()
  closing_day?: number;

  @IsOptional()
  @IsInt()
  due_day?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

