import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Categorías')
@ApiBearerAuth('bearer')
@Controller('categories')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'manager')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva categoría' })
  @ApiResponse({ status: 201, description: 'Categoría creada exitosamente' })
  async create(
    @Body() createDto: CreateCategoryDto,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const category = await this.categoriesService.create(tenantId, createDto);

    return {
      success: true,
      message: 'Categoría creada exitosamente',
      category,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las categorías' })
  async findAll(
    @GetUser() user: any,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const filters = { isActive, search };
    const categories = await this.categoriesService.findAll(tenantId, filters);

    return {
      success: true,
      count: categories.length,
      categories,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener categoría por ID' })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const category = await this.categoriesService.findOne(id, tenantId);

    return {
      success: true,
      category,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar categoría' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCategoryDto,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const category = await this.categoriesService.update(id, tenantId, updateDto);

    return {
      success: true,
      message: 'Categoría actualizada exitosamente',
      category,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar categoría' })
  async delete(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    await this.categoriesService.delete(id, tenantId);

    return {
      success: true,
      message: 'Categoría eliminada exitosamente',
    };
  }
}
