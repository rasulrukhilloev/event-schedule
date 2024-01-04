import { InputType, Field } from '@nestjs/graphql';
import { IsDate, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class EventFilterInput {
  @Field(() => Date, { nullable: true })
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @Field(() => String, { nullable: true })
  @IsUUID()
  @IsOptional()
  locationId?: string;
}
