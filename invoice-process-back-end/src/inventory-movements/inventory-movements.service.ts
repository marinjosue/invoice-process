import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InventoryMovement, MovementType } from './schemas/inventory-movement.schema';
import { Product } from '../products/schemas/product.schema';
import { CreateInventoryMovementDto, UpdateInventoryMovementDto } from './dto/inventory-movement.dto';

@Injectable()
export class InventoryMovementsService {
  constructor(
    @InjectModel(InventoryMovement.name) private inventoryMovementModel: Model<InventoryMovement>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async create(tenantId: string, userId: string, createDto: CreateInventoryMovementDto) {
    if (createDto.type === MovementType.ENTRY && !createDto.settlementId) {
      throw new ForbiddenException(
        'Los movimientos tipo ENTRY solo pueden crearse desde liquidaciones finalizadas. ' +
        'Use EXIT para salidas de inventario o ADJUSTMENT para correcciones.'
      );
    }

    // Buscar el producto
    const product = await this.productModel.findById(createDto.productId);
    
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (product.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado para este producto');
    }

    const previousStock = product.currentStock || 0;
    let newStock = previousStock;

    // Calcular nuevo stock según el tipo de movimiento
    switch (createDto.type) {
      case MovementType.ENTRY:
        newStock = previousStock + createDto.quantity;
        break;
      case MovementType.EXIT:
        if (previousStock < createDto.quantity) {
          throw new BadRequestException(`Stock insuficiente. Stock actual: ${previousStock}`);
        }
        newStock = previousStock - createDto.quantity;
        break;
      case MovementType.ADJUSTMENT:
        newStock = createDto.quantity; 
        break;
    }

    // Crear el movimiento
    const movement = await this.inventoryMovementModel.create({
      ...createDto,
      tenantId: new Types.ObjectId(tenantId),
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(createDto.productId),
      invoiceId: createDto.invoiceId ? new Types.ObjectId(createDto.invoiceId) : undefined,
      settlementId: createDto.settlementId ? new Types.ObjectId(createDto.settlementId) : undefined,
      previousStock,
      newStock,
      movementDate: createDto.movementDate || new Date(),
    });

    // Actualizar el stock del producto
    await this.productModel.findByIdAndUpdate(
      createDto.productId,
      { currentStock: newStock }
    );

    return movement;
  }

  async findAll(tenantId: string, filters?: any) {
    const query: any = { tenantId: new Types.ObjectId(tenantId) };

    if (filters?.productId) {
      query.productId = new Types.ObjectId(filters.productId);
    }

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.startDate || filters?.endDate) {
      query.movementDate = {};
      if (filters.startDate) {
        query.movementDate.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.movementDate.$lte = new Date(filters.endDate);
      }
    }

    return this.inventoryMovementModel
      .find(query)
      .populate('productId', 'sku description unit')
      .populate({
        path: 'userId',
        select: 'username',
        populate: { path: 'personaId', select: 'firstName lastName email' },
      })
      .populate('invoiceId', 'invoice_number')
      .populate('settlementId')
      .sort({ movementDate: -1 });
  }

  async findOne(id: string, tenantId: string) {
    const movement = await this.inventoryMovementModel
      .findById(id)
      .populate('productId', 'sku description unit currentStock')
      .populate({
        path: 'userId',
        select: 'username',
        populate: { path: 'personaId', select: 'firstName lastName email' },
      })
      .populate('invoiceId', 'invoice_number status')
      .populate('settlementId');

    if (!movement) {
      throw new NotFoundException('Movimiento no encontrado');
    }

    if (movement.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado');
    }

    return movement;
  }

  async update(id: string, tenantId: string, updateDto: UpdateInventoryMovementDto) {
    const movement = await this.inventoryMovementModel.findById(id);

    if (!movement) {
      throw new NotFoundException('Movimiento no encontrado');
    }

    if (movement.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado');
    }

    // Solo permitir actualizar notas y razón
    const updated = await this.inventoryMovementModel.findByIdAndUpdate(
      id,
      { 
        notes: updateDto.notes,
        reason: updateDto.reason 
      },
      { new: true }
    ).populate('productId', 'sku description')
     .populate({
        path: 'userId',
        select: 'username',
        populate: { path: 'personaId', select: 'firstName lastName email' },
      });

    return updated;
  }

  async delete(id: string, tenantId: string) {
    const movement = await this.inventoryMovementModel.findById(id);

    if (!movement) {
      throw new NotFoundException('Movimiento no encontrado');
    }

    if (movement.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado');
    }

    // No permitir eliminar movimientos, solo actualizar notas
    throw new BadRequestException('No se pueden eliminar movimientos de inventario. Use la función de ajuste para corregir errores.');
  }

  async getStatistics(tenantId: string) {
    const movements = await this.inventoryMovementModel.find({
      tenantId: new Types.ObjectId(tenantId),
    });

    const total = movements.length;
    const byType = movements.reduce((acc, movement) => {
      acc[movement.type] = (acc[movement.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      byType,
    };
  }

  async getProductHistory(productId: string, tenantId: string) {
    return this.inventoryMovementModel
      .find({
        tenantId: new Types.ObjectId(tenantId),
        productId: new Types.ObjectId(productId),
      })
      .populate({
        path: 'userId',
        select: 'username',
        populate: { path: 'personaId', select: 'firstName lastName email' },
      })
      .populate('invoiceId', 'invoice_number')
      .populate('settlementId')
      .sort({ movementDate: -1 });
  }
}
