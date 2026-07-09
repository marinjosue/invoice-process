import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SettlementsService } from './settlements.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { CreateSettlementDto, UpdateSettlementDto, AddInvoiceToSettlementDto } from './dto/settlement.dto';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequierePermiso } from '../common/decorators/require-permission.decorator';

@ApiTags('Liquidaciones')
@ApiBearerAuth('bearer')
@Controller('settlements')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@RequierePermiso('settlements')
export class SettlementsController {
  constructor(private settlementsService: SettlementsService) { }

  @Post()
  @ApiOperation({ summary: 'Crear nueva liquidación' })
  @ApiResponse({ status: 201, description: 'Liquidación creada exitosamente' })
  async create(
    @Body() createSettlementDto: CreateSettlementDto,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const settlement = await this.settlementsService.create(tenantId, createSettlementDto);

    return {
      success: true,
      message: 'Liquidación creada exitosamente',
      settlement,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las liquidaciones' })
  async findAll(
    @GetUser() user: any,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const filters = { userId, status, startDate, endDate };
    const settlements = await this.settlementsService.findAll(tenantId, filters);

    return {
      success: true,
      count: settlements.length,
      settlements,
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Obtener estadísticas de liquidaciones' })
  async getStatistics(@GetUser() user: any) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const statistics = await this.settlementsService.getStatistics(tenantId);

    return {
      success: true,
      statistics,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener liquidación por ID' })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const settlement = await this.settlementsService.findOne(id, tenantId);

    return {
      success: true,
      settlement,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar liquidación' })
  async update(
    @Param('id') id: string,
    @Body() updateSettlementDto: UpdateSettlementDto,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const settlement = await this.settlementsService.update(id, tenantId, updateSettlementDto);

    return {
      success: true,
      message: 'Liquidación actualizada exitosamente',
      settlement,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar liquidación' })
  async delete(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    await this.settlementsService.delete(id, tenantId);

    return {
      success: true,
      message: 'Liquidación eliminada exitosamente',
    };
  }

  @Post(':id/invoices')
  @ApiOperation({ summary: 'Agregar factura a liquidación' })
  async addInvoice(
    @Param('id') id: string,
    @Body() addInvoiceDto: AddInvoiceToSettlementDto,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const settlement = await this.settlementsService.addInvoice(id, tenantId, addInvoiceDto);

    return {
      success: true,
      message: 'Factura agregada a liquidación',
      settlement,
    };
  }

  @Delete(':id/invoices/:invoiceId')
  @ApiOperation({ summary: 'Remover factura de liquidación' })
  async removeInvoice(
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const settlement = await this.settlementsService.removeInvoice(id, tenantId, invoiceId);

    return {
      success: true,
      message: 'Factura removida de liquidación',
      settlement,
    };
  }

  @Post(':id/finalize')
  @ApiOperation({ summary: 'Finalizar liquidación (prorratear costos y actualizar inventario)' })
  @ApiResponse({ status: 200, description: 'Liquidación finalizada exitosamente' })
  async finalize(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const userId = user._id.toString();

    const result = await this.settlementsService.finalize(id, tenantId, userId);

    return {
      success: true,
      message: 'Liquidación finalizada exitosamente',
      ...result,
    };
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Generar reporte PDF de la liquidación' })
  @ApiResponse({ status: 201, description: 'Reporte generado y subido a GCS' })
  async generateReport(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const result = await this.settlementsService.generateReport(id, tenantId);

    return {
      success: true,
      message: 'Reporte generado exitosamente',
      ...result,
    };
  }

  @Get(':id/report')
  @ApiOperation({ summary: 'Obtener URL del reporte PDF existente' })
  @ApiResponse({ status: 200, description: 'URL firmada del reporte' })
  async getReport(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    const result = await this.settlementsService.getReport(id, tenantId);

    return {
      success: true,
      ...result,
    };
  }
}
