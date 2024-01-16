import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';
import { IsNotEmpty } from 'class-validator';
import { User } from '../../users/entity/users.entity';

@InputType()
export class LoginUserInput {
  @Field()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field()
  @IsNotEmpty()
  password: string;
}

@ObjectType()
export class LoginResponse {
  @Field(() => User)
  user: User;

  @Field()
  token: string;
}

export type UserWithoutPassword = Omit<User, 'password'>;
