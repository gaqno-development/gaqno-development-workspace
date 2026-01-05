import { Injectable } from '@nestjs/common';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateDtoConstraint = object;
export type UpdateDtoConstraint = object;

@Injectable()
export abstract class BaseCrudService<
  TEntity extends BaseEntity,
  TCreateDto extends CreateDtoConstraint,
  TUpdateDto extends UpdateDtoConstraint
> {
  protected abstract entities: TEntity[];
  protected abstract idPrefix: string;

  protected generateId(): string {
    return `${this.idPrefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected createTimestamps(): { createdAt: Date; updatedAt: Date } {
    const now = new Date();
    return {
      createdAt: now,
      updatedAt: now,
    };
  }

  create(dto: TCreateDto): TEntity {
    const entity = {
      id: this.generateId(),
      ...dto,
      ...this.createTimestamps(),
    } as unknown as TEntity;
    this.entities.push(entity);
    return entity;
  }

  list(): TEntity[] {
    return this.entities;
  }

  findById(id: string): TEntity | undefined {
    return this.entities.find((entity) => entity.id === id);
  }

  update(id: string, dto: TUpdateDto): TEntity | null {
    const entity = this.findById(id);
    if (!entity) {
      return null;
    }

    Object.assign(entity, dto);
    entity.updatedAt = new Date();
    return entity;
  }

  delete(id: string): boolean {
    const index = this.entities.findIndex((entity) => entity.id === id);
    if (index === -1) {
      return false;
    }
    this.entities.splice(index, 1);
    return true;
  }
}

