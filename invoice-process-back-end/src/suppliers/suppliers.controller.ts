import { Controller, Post, Get, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@ApiTags('Proveedores')
@ApiBearerAuth('bearer')
@Controller('suppliers')
@UseGuards(AuthGuard('jwt'))
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) {}

  @Post()
  async create(
    @Body() createSupplierDto: CreateSupplierDto,
    @GetUser('tenantId') tenantId: any,
  ) {
    return this.suppliersService.create(tenantId._id.toString(), createSupplierDto);
  }

  @Get()
  async findAll(
    @GetUser('tenantId') tenantId: any,
    @Query() filters?: any,
  ) {
    const suppliers = await this.suppliersService.findAll(tenantId._id.toString(), filters);
    return {
      success: true,
      count: suppliers.length,
      suppliers,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetUser('tenantId') tenantId: any,
  ) {
    const supplier = await this.suppliersService.findOne(id, tenantId._id.toString());
    return {
      success: true,
      supplier,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
    @GetUser('tenantId') tenantId: any,
  ) {
    const supplier = await this.suppliersService.update(id, tenantId._id.toString(), updateSupplierDto);
    return {
      success: true,
      message: 'Proveedor actualizado exitosamente',
      supplier,
    };
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @GetUser('tenantId') tenantId: any,
  ) {
    return this.suppliersService.delete(id, tenantId._id.toString());
  }
}
