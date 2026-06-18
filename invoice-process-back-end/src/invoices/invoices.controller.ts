import { Controller, Post, Get, Put, Delete, Param, Body, Query, UseGuards, UseInterceptors, UploadedFile, Logger, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvoicesService } from './invoices.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Facturas')
@ApiBearerAuth('bearer')
@Controller('invoices')
export class InvoicesController {
  private readonly logger = new Logger(InvoicesController.name);
  constructor(private invoicesService: InvoicesService) {}

  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Subir y procesar factura' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Factura procesada exitosamente' })
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos PDF, Excel o CSV'), false);
      }
    }
  }))
  async uploadAndProcess(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: any,
  ) {
    const userId = user._id.toString();
    const tenantId = user.tenantId._id.toString();
    return this.invoicesService.uploadAndProcess(file, userId, tenantId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(
    @GetUser() user: any,
    @Query('status') status?: string,
  ) {
    // Log para debug
    this.logger.debug(`Usuario completo: ${JSON.stringify(user)}`);
    this.logger.debug(`user.tenantId: ${JSON.stringify(user.tenantId)}`);
    
    // Validar que tenantId existe
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }
    
    const tenantId = user.tenantId._id.toString();
    this.logger.debug(`TenantId usado para filtrar: ${tenantId}`);
    
    const invoices = await this.invoicesService.findAll(tenantId, status);
    
    this.logger.debug(`Facturas encontradas: ${invoices.length}`);
    if (invoices.length > 0) {
      this.logger.debug(`IDs de facturas: ${invoices.map(inv => inv._id).join(', ')}`);
    }
    
    return {
      success: true,
      count: invoices.length,
      invoices,
      debug: {
        tenantId,
        userEmail: user.email
      }
    };
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }
    
    const tenantId = user.tenantId._id.toString();
    this.logger.debug(`Buscando factura ${id} con tenantId: ${tenantId}`);
    
    const invoice = await this.invoicesService.findOne(id, tenantId);
    return {
      success: true,
      invoice
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Actualizar factura' })
  async update(
    @Param('id') id: string,
    @Body() updateData: any,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }
    
    const tenantId = user.tenantId._id.toString();
    const invoice = await this.invoicesService.update(id, tenantId, updateData);
    
    return {
      success: true,
      invoice
    };
  }

  @Put(':id/validate')
  @UseGuards(AuthGuard('jwt'))
  async validate(
    @Param('id') id: string,
    @Body() updateData: any,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }
    
    const tenantId = user.tenantId._id.toString();
    return await this.invoicesService.validate(id, tenantId, updateData);
  }

  @Post('validate-and-save')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Validar productos y guardar factura' })
  async validateAndSave(
    @Body() invoiceData: any,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }
    
    const tenantId = user.tenantId._id.toString();
    const userId = user._id.toString();
    
    const result = await this.invoicesService.validateAndSaveInvoice(invoiceData, tenantId, userId);
    
    return {
      success: true,
      invoice: result,
      message: 'Factura guardada y productos validados correctamente'
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async delete(
    @Param('id') id: string,
    @GetUser('tenantId') tenantId: any,
  ) {
    return this.invoicesService.delete(id, tenantId._id.toString());
  }

  @Get(':id/file-url')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Obtener URL firmada para ver/descargar archivo de factura' })
  async getFileUrl(
    @Param('id') id: string,
    @Query('mode') mode: 'view' | 'download' = 'view',
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }
    
    const tenantId = user.tenantId._id.toString();
    return this.invoicesService.getFileUrl(id, tenantId, mode);
  }
}
