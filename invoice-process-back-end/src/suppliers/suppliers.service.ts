import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Supplier } from './schemas/supplier.schema';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<Supplier>,
  ) {}

  async create(tenantId: string, createSupplierDto: CreateSupplierDto) {
    // Autogenerar supplierId si no se proporciona
    const supplierId = createSupplierDto.supplierId || 
      `SUP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const existing = await this.supplierModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
      supplierId: supplierId,
    });

    if (existing) {
      throw new ConflictException('Proveedor con este ID ya existe');
    }

    const supplier = await this.supplierModel.create({
      ...createSupplierDto,
      supplierId,
      tenantId: new Types.ObjectId(tenantId),
    });

    return supplier;
  }

  async findOrCreate(tenantId: string, supplierName: string, additionalData?: Partial<CreateSupplierDto>) {
    // Buscar por nombre
    let supplier = await this.supplierModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
      name: { $regex: new RegExp(`^${supplierName}$`, 'i') },
    });

    if (!supplier) {
      // Crear nuevo proveedor
      const supplierId = `SUP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      supplier = await this.supplierModel.create({
        tenantId: new Types.ObjectId(tenantId),
        supplierId,
        name: supplierName,
        ...additionalData,
      });
    }

    return supplier;
  }

  async findAll(tenantId: string, filters?: any) {
    const query: any = { tenantId: new Types.ObjectId(tenantId) };

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive === 'true';
    }

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { supplierId: { $regex: filters.search, $options: 'i' } },
        { taxId: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return this.supplierModel
      .find(query)
      .sort({ createdAt: -1 });
  }

  async findOne(id: string, tenantId: string) {
    const supplier = await this.supplierModel.findById(id);

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    if (supplier.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado para ver este proveedor');
    }

    return supplier;
  }

  async findByName(name: string, tenantId: string) {
    return this.supplierModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });
  }

  async update(id: string, tenantId: string, updateSupplierDto: UpdateSupplierDto) {
    const supplier = await this.supplierModel.findById(id);

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    if (supplier.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado');
    }

    Object.assign(supplier, updateSupplierDto);
    await supplier.save();
    return supplier;
  }

  async delete(id: string, tenantId: string) {
    const supplier = await this.supplierModel.findById(id);

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    if (supplier.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado');
    }

    await supplier.deleteOne();

    return {
      success: true,
      message: 'Proveedor eliminado exitosamente',
    };
  }

  async incrementInvoiceStats(supplierId: string, amount: number) {
    await this.supplierModel.findByIdAndUpdate(supplierId, {
      $inc: {
        invoiceCount: 1,
        totalPurchases: amount,
      },
    });
  }
}
