import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequierePermiso } from '../common/decorators/require-permission.decorator';

@ApiTags('Productos')
@ApiBearerAuth('bearer')
@Controller('products')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@RequierePermiso('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo producto' })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const product = await this.productsService.create(tenantId, createProductDto);

    return {
      success: true,
      message: 'Producto creado exitosamente',
      product,
    };
  }

  @Get()
  async findAll(
    @GetUser() user: any,
    @Query('supplierId') supplierId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const filters = { supplierId, categoryId, isActive, search };
    const products = await this.productsService.findAll(tenantId, filters);

    return {
      success: true,
      count: products.length,
      products,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const product = await this.productsService.findOne(id, tenantId);

    return {
      success: true,
      product,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const product = await this.productsService.update(id, tenantId, updateProductDto);

    return {
      success: true,
      message: 'Producto actualizado exitosamente',
      product,
    };
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    return await this.productsService.delete(id, tenantId);
  }
}
