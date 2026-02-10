import { Body, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Role } from "@gaqno-development/types";
import {
  BaseCrudService,
  BaseEntity,
  CreateDtoConstraint,
  UpdateDtoConstraint,
} from "./base-crud.service";

export interface CrudControllerOptions {
  path: string;
  createRoles?: Role[];
  listRoles?: Role[];
  findByIdRoles?: Role[];
  updateRoles?: Role[];
  deleteRoles?: Role[];
}

export abstract class BaseCrudController<
  TEntity extends BaseEntity,
  TCreateDto extends CreateDtoConstraint,
  TUpdateDto extends UpdateDtoConstraint,
> {
  constructor(
    protected readonly service: BaseCrudService<
      TEntity,
      TCreateDto,
      TUpdateDto
    >,
    protected readonly options: CrudControllerOptions
  ) {}

  @Post()
  create(@Body() dto: TCreateDto): TEntity {
    return this.service.create(dto);
  }

  @Get()
  list(): TEntity[] {
    return this.service.list();
  }

  @Get(":id")
  findById(@Param("id") id: string): TEntity | undefined {
    return this.service.findById(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: TUpdateDto): TEntity | null {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  delete(@Param("id") id: string): boolean {
    return this.service.delete(id);
  }
}
