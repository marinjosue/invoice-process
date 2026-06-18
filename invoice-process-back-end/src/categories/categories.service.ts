import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category } from './schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async create(tenantId: string, createDto: CreateCategoryDto) {
    try {
      const category = await this.categoryModel.create({
        ...createDto,
        tenantId: new Types.ObjectId(tenantId),
      });
      return category;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
      throw error;
    }
  }

  async findAll(tenantId: string, filters?: any) {
    const query: any = { tenantId: new Types.ObjectId(tenantId) };

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive === 'true';
    }

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { code: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return this.categoryModel.find(query).sort({ name: 1 });
  }

  async findOne(id: string, tenantId: string) {
    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (category.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado');
    }

    return category;
  }

  async update(id: string, tenantId: string, updateDto: UpdateCategoryDto) {
    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (category.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado');
    }

    try {
      const updated = await this.categoryModel.findByIdAndUpdate(
        id,
        updateDto,
        { new: true }
      );
      return updated;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
      throw error;
    }
  }

  async delete(id: string, tenantId: string) {
    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (category.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado');
    }

    await category.deleteOne();
    return { deleted: true };
  }
}
