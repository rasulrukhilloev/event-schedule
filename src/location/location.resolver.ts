import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { LocationService } from './location.service';
import { Location } from './entities/location.entity';
import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';

@Resolver(() => Location)
export class LocationResolver {
  constructor(private locationService: LocationService) {}

  @Mutation(() => Location)
  createLocation(
    @Args('createLocationInput') createLocationInput: CreateLocationInput,
  ): Promise<Location> {
    return this.locationService.create(createLocationInput);
  }

  @Mutation(() => Location)
  updateLocation(
    @Args('id') id: string,
    @Args('updateLocationInput') updateLocationInput: UpdateLocationInput,
  ): Promise<Location> {
    return this.locationService.update(id, updateLocationInput);
  }

  @Query(() => [Location])
  findLocations(
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
    @Args('take', { type: () => Int, defaultValue: 10 }) take: number,
  ): Promise<Location[]> {
    return this.locationService.findAll(skip, take);
  }

  @Mutation(() => Boolean)
  deleteLocation(@Args('id') id: string): Promise<boolean> {
    return this.locationService.remove(id).then(() => true);
  }
}
