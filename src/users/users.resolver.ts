import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './entity/users.entity';
import { CreateUserInput } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput);
  }

  @Query(() => [User])
  findAllUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }
}
