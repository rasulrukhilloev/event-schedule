import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class CreateEventInput {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  @IsNotEmpty()
  startDate: Date;

  @Field()
  @IsNotEmpty()
  endDate: Date;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  locationId?: string;

  @Field({ nullable: true })
  @IsNotEmpty()
  @IsOptional()
  newLocationName?: string;
}
