import { CreateLocationInput } from './create-location.input';
import { InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateLocationInput extends PartialType(CreateLocationInput) {}
