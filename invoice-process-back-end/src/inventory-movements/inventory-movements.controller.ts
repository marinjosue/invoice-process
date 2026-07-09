import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { InventoryMovementsService } from './inventory-movements.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { CreateInventoryMovementDto, UpdateInventoryMovementDto } from './dto/inventory-movement.dto';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequierePermiso } from '../common/decorators/require-permission.decorator';

@ApiTags('Movimientos de Inventario')
@ApiBearerAuth('bearer')
@Controller('inventory-movements')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@RequierePermiso('inventory')
export class InventoryMovementsController {
  constructor(private inventoryMovementsService: InventoryMovementsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo movimiento de inventario' })
  @ApiResponse({ status: 201, description: 'Movimiento creado exitosamente' })
  async create(
    @Body() createDto: CreateInventoryMovementDto,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const userId = user.sub || user.id;
    const movement = await this.inventoryMovementsService.create(tenantId, userId, createDto);

    return {
      success: true,
      message: 'Movimiento de inventario creado exitosamente',
      movement,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los movimientos de inventario' })
  async findAll(
    @GetUser() user: any,
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const filters = { productId, type, startDate, endDate };
    const movements = await this.inventoryMovementsService.findAll(tenantId, filters);

    return {
      success: true,
      count: movements.length,
      movements,
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Obtener estadísticas de movimientos' })
  async getStatistics(@GetUser() user: any) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const statistics = await this.inventoryMovementsService.getStatistics(tenantId);

    return {
      success: true,
      statistics,
    };
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Obtener historial de movimientos de un producto' })
  async getProductHistory(
    @Param('productId') productId: string,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const movements = await this.inventoryMovementsService.getProductHistory(productId, tenantId);

    return {
      success: true,
      count: movements.length,
      movements,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener movimiento por ID' })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const movement = await this.inventoryMovementsService.findOne(id, tenantId);

    return {
      success: true,
      movement,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar movimiento (solo notas y razón)' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateInventoryMovementDto,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const movement = await this.inventoryMovementsService.update(id, tenantId, updateDto);

    return {
      success: true,
      message: 'Movimiento actualizado exitosamente',
      movement,
    };
  }
}
