import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventModule } from './event/event.module';
import { LocationModule } from './location/location.module';
import { GraphQLError } from 'graphql';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), '../schema.gql'),
      formatError: (error: GraphQLError) => {
        const originalError = error.extensions?.originalError as
          | {
              message?: string;
              error?: string;
              statusCode?: number;
            }
          | undefined;

        if (originalError) {
          return {
            message: originalError.message || error.message,
            code: originalError.error,
            statusCode: originalError.statusCode,
          };
        }

        return {
          message: error.message,
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        type: configService.get('DB_TYPE') as any,
        host: configService.get<string>('PG_HOST'),
        port: parseInt(configService.get<string>('PG_PORT')),
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('PG_DB'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    EventModule,
    LocationModule,
  ],
})
export class AppModule {}
