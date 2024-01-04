import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginResponse, LoginUserInput } from './dto/login.dto';
import { AuthService } from './auth.service';
import { User } from 'src/users/entity/users.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorator/current-user.decorator';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => LoginResponse)
  @UseGuards(LocalAuthGuard)
  login(
    @Args('loginUserInput') loginUserInput: LoginUserInput,
    @CurrentUser() user: User,
  ): Promise<LoginResponse> {
    return this.authService.login(user);
  }

  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User): User {
    return user;
  }
}
