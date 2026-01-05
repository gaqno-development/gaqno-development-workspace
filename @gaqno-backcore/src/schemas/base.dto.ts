import { IsOptional } from 'class-validator';

export abstract class BaseCreateDto {
  createdAt?: Date;
  updatedAt?: Date;
}

export abstract class BaseUpdateDto {
  @IsOptional()
  updatedAt?: Date;
}

