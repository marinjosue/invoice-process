import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './schemas/product.schema';

// ObjectIds válidos (24 hex) — el service convierte tenantId con new Types.ObjectId().
const TENANT = '507f1f77bcf86cd799439011';
const OTHER_TENANT = '507f1f77bcf86cd799439099';

describe('ProductsService', () => {
  let service: ProductsService;
  let model: {
    findOne: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
  };

  beforeEach(async () => {
    model = {
      findOne: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getModelToken(Product.name), useValue: model },
      ],
    }).compile();

    service = moduleRef.get<ProductsService>(ProductsService);
  });

  it('debe crearse', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { sku: 'SKU-1', description: 'Tornillo', unit: 'UND' } as any;

    it('lanza ConflictException si el SKU ya existe en el tenant', async () => {
      model.findOne.mockResolvedValue({ _id: 'existing' });

      await expect(service.create(TENANT, dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(model.create).not.toHaveBeenCalled();
    });

    it('crea el producto cuando el SKU es único', async () => {
      model.findOne.mockResolvedValue(null);
      model.create.mockResolvedValue({ sku: 'SKU-1' });

      const res = await service.create(TENANT, dto);

      expect(res).toEqual({ sku: 'SKU-1' });
      expect(model.create).toHaveBeenCalledTimes(1);
      // El tenantId se persiste como ObjectId, no como string crudo.
      const arg = model.create.mock.calls[0][0];
      expect(arg.sku).toBe('SKU-1');
      expect(arg.tenantId.toString()).toBe(TENANT);
    });
  });

  describe('update', () => {
    it('lanza NotFoundException si el producto no existe', async () => {
      model.findById.mockResolvedValue(null);

      await expect(service.update('id', TENANT, {} as any)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lanza ForbiddenException si el producto es de otro tenant', async () => {
      model.findById.mockResolvedValue({
        tenantId: TENANT,
        sku: 'SKU-1',
        save: jest.fn(),
      });

      await expect(
        service.update('id', OTHER_TENANT, {} as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lanza ConflictException si el nuevo SKU ya existe', async () => {
      model.findById.mockResolvedValue({
        tenantId: TENANT,
        sku: 'OLD',
        save: jest.fn(),
      });
      model.findOne.mockResolvedValue({ _id: 'other' });

      await expect(
        service.update('id', TENANT, { sku: 'NEW' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('guarda los cambios cuando todo es válido', async () => {
      const doc: any = {
        tenantId: TENANT,
        sku: 'SKU-1',
        description: 'viejo',
        save: jest.fn().mockResolvedValue(true),
      };
      model.findById.mockResolvedValue(doc);

      const res = await service.update('id', TENANT, {
        description: 'nuevo',
      } as any);

      expect(doc.description).toBe('nuevo');
      expect(doc.save).toHaveBeenCalled();
      expect(res).toBe(doc);
    });
  });

  describe('delete', () => {
    it('lanza NotFoundException si no existe', async () => {
      model.findById.mockResolvedValue(null);

      await expect(service.delete('id', TENANT)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lanza ForbiddenException si es de otro tenant', async () => {
      model.findById.mockResolvedValue({
        tenantId: TENANT,
        deleteOne: jest.fn(),
      });

      await expect(service.delete('id', OTHER_TENANT)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('elimina el producto del tenant correcto', async () => {
      const doc: any = {
        tenantId: TENANT,
        deleteOne: jest.fn().mockResolvedValue(true),
      };
      model.findById.mockResolvedValue(doc);

      const res = await service.delete('id', TENANT);

      expect(doc.deleteOne).toHaveBeenCalled();
      expect(res).toEqual({
        success: true,
        message: 'Producto eliminado exitosamente',
      });
    });
  });
});
