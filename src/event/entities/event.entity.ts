import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Location } from '../../location/entities/location.entity';
import { User } from '../../users/entity/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@ObjectType()
@Entity()
export class Event {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column()
  description: string;

  @Field()
  @Column()
  startDate: Date;

  @Field()
  @Column()
  endDate: Date;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.events)
  createdBy: User;

  @Field(() => Location, { nullable: true })
  @ManyToOne(() => Location, (location) => location.events, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinTable()
  location: Location;
}
