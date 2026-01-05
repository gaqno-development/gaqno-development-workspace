import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomClassDto } from './create-custom-class.dto';

export class UpdateCustomClassDto extends PartialType(CreateCustomClassDto) {}

