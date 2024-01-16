import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { LocationService } from './location.service';
import { Location } from './entities/location.entity';
import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Resolver(() => Location)
export class LocationResolver {
  constructor(private locationService: LocationService) {}

  @Mutation(() => Location)
  @UseGuards(JwtAuthGuard)
  createLocation(
    @Args('createLocationInput') createLocationInput: CreateLocationInput,
  ): Promise<Location> {
    return this.locationService.create(createLocationInput);
  }

  @Mutation(() => Location)
  @UseGuards(JwtAuthGuard)
  updateLocation(
    @Args('id') id: string,
    @Args('updateLocationInput') updateLocationInput: UpdateLocationInput,
  ): Promise<Location> {
    return this.locationService.update(id, updateLocationInput);
  }

  @Query(() => [Location])
  @UseGuards(JwtAuthGuard)
  findLocations(
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
    @Args('take', { type: () => Int, defaultValue: 10 }) take: number,
  ): Promise<Location[]> {
    return this.locationService.findAll(skip, take);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  deleteLocation(@Args('id') id: string): Promise<boolean> {
    return this.locationService.remove(id).then(() => true);
  }
}
