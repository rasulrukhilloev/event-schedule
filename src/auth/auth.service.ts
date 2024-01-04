import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/users/entity/users.entity';
import { LoginResponse, UserWithoutPassword } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.usersService.findByEmail(email);

    if (user) {
      const isPasswordMatching = await bcrypt.compare(password, user.password);
      if (isPasswordMatching) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: User): Promise<LoginResponse> {
    try {
      const payload = {
        sub: user.id,
        email: user.email,
      };
      return {
        user,
        token: this.jwtService.sign(payload),
      };
    } catch (error) {
      throw new Error(`Error logging in ${error} user ${error.message}`);
    }
  }
}
