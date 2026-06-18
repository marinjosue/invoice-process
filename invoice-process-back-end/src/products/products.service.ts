import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async create(tenantId: string, createProductDto: CreateProductDto) {
    const existingSKU = await this.productModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
      sku: createProductDto.sku,
    });

    if (existingSKU) {
      throw new ConflictException('SKU ya existe para este tenant');
    }

    const product = await this.productModel.create({
      ...createProductDto,
      tenantId: new Types.ObjectId(tenantId),
      supplierId: createProductDto.supplierId ? new Types.ObjectId(createProductDto.supplierId) : undefined,
      categoryId: createProductDto.categoryId ? new Types.ObjectId(createProductDto.categoryId) : undefined,
    });

    return product;
  }

  async findAll(tenantId: string, filters?: any) {
    const query: any = { tenantId: new Types.ObjectId(tenantId) };

    if (filters?.supplierId) {
      query.supplierId = new Types.ObjectId(filters.supplierId);
    }

    if (filters?.categoryId) {
      query.categoryId = new Types.ObjectId(filters.categoryId);
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive === 'true';
    }

    if (filters?.search) {
      query.$or = [
        { sku: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return this.productModel
      .find(query)
      .populate('supplierId', 'name')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });
  }

  async findOne(id: string, tenantId: string) {
    const product = await this.productModel
      .findById(id)
      .populate('supplierId', 'name country')
      .populate('categoryId', 'name description');

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (product.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado para ver este producto');
    }

    return product;
  }

  // Alias para findOne
  async findById(id: string, tenantId: string) {
    return this.findOne(id, tenantId);
  }

  async findBySKU(sku: string, tenantId: string) {
    return this.productModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
      sku,
    });
  }

  async update(id: string, tenantId: string, updateProductDto: UpdateProductDto) {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (product.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado');
    }

    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingSKU = await this.productModel.findOne({
        tenantId: new Types.ObjectId(tenantId),
        sku: updateProductDto.sku,
        _id: { $ne: id },
      });

      if (existingSKU) {
        throw new ConflictException('SKU ya existe para este tenant');
      }
    }

    Object.assign(product, updateProductDto);

    if (updateProductDto.supplierId) {
      product.supplierId = new Types.ObjectId(updateProductDto.supplierId);
    }

    if (updateProductDto.categoryId) {
      product.categoryId = new Types.ObjectId(updateProductDto.categoryId);
    }

    await product.save();
    return product;
  }

  async delete(id: string, tenantId: string) {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (product.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado');
    }

    await product.deleteOne();

    return {
      success: true,
      message: 'Producto eliminado exitosamente',
    };
  }

  async updateStock(id: string, tenantId: string, quantity: number) {
    const product = await this.findOne(id, tenantId);
    product.currentStock += quantity;
    await product.save();
    return product;
  }
}
