import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class CreateLocationInput {
  @Field()
  @IsNotEmpty()
  name: string;
}
