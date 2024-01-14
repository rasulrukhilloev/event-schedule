import { InputType, Field } from '@nestjs/graphql';
import { IsDate, IsOptional } from 'class-validator';

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

  @Field({ nullable: true })
  @IsOptional()
  location?: string;
}
