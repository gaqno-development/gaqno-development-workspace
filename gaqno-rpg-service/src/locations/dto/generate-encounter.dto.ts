import { IsNumber, IsNotEmpty, IsString, IsOptional, Min, Max } from 'class-validator';

export class GenerateEncounterDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(20)
  partyLevel: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(10)
  partySize: number;

  @IsString()
  @IsNotEmpty()
  difficulty: 'easy' | 'medium' | 'hard' | 'deadly';

  @IsString()
  @IsOptional()
  environment?: string;
}

