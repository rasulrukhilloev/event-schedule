import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Event } from 'src/event/entities/event.entity';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@ObjectType()
@Unique(['name'])
@Entity()
export class Location {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String)
  @Column()
  name: string;

  @OneToMany(() => Event, (event) => event.location)
  events: Event[];
}
