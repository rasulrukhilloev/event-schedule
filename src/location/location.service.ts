import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { CreateLocationInput, UpdateLocationInput } from './dto';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
  ) {}

  async create(createLocationInput: CreateLocationInput): Promise<Location> {
    const location = this.locationRepository.create(createLocationInput);
    return this.locationRepository.save(location);
  }

  async update(
    id: string,
    updateLocationInput: UpdateLocationInput,
  ): Promise<Location> {
    await this.locationRepository.update(id, updateLocationInput);
    return this.locationRepository.findOne({ where: { id } });
  }

  async findAll(skip: number = 0, take: number = 10): Promise<Location[]> {
    return this.locationRepository.find({
      skip,
      take,
    });
  }

  async findOne(id: string): Promise<Location> {
    return this.locationRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.locationRepository.delete(id);
  }
}
