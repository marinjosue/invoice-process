import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from './schemas/tenant.schema';

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
  ) {}

  async findById(id: string): Promise<Tenant | null> {
    return this.tenantModel.findById(id);
  }

  async findBySubdomain(subdomain: string): Promise<Tenant | null> {
    return this.tenantModel.findOne({ subdomain });
  }

  async create(tenantData: any): Promise<Tenant> {
    const tenant = new this.tenantModel(tenantData);
    return tenant.save();
  }
}
