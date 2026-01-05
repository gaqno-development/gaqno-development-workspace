import { IsString, IsNumber, IsInt, IsOptional } from 'class-validator';

export class CreateCreditCardDto {
  @IsString()
  name: string;

  @IsString()
  last_four_digits: string;

  @IsString()
  card_type: string;

  @IsOptional()
  @IsString()
  bank_name?: string;

  @IsNumber()
  credit_limit: number;

  @IsInt()
  closing_day: number;

  @IsInt()
  due_day: number;

  @IsString()
  color: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

