import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Event } from '../../event/entities/event.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@ObjectType()
@Unique(['email'])
@Entity()
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ nullable: true })
  @Column()
  name: string;

  @Field(() => String)
  @Column()
  email: string;

  @Column()
  password: string;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Event, (event) => event.createdBy)
  events: Event[];
}
