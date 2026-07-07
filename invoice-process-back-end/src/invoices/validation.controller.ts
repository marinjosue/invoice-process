import { Controller, Post, Body, UseGuards, BadRequestException, Get, Param, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequierePermiso } from '../common/decorators/require-permission.decorator';

@ApiTags('Validación de Facturas')
@ApiBearerAuth('bearer')
@Controller('invoices')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@RequierePermiso('invoices.manage')
export class ValidationController {
  private readonly logger = new Logger(ValidationController.name);

  constructor(private invoicesService: InvoicesService) {}

  @Get(':id/check-duplicates')
  @ApiOperation({ summary: 'Verificar si proveedores y productos ya existen' })
  async checkDuplicates(
    @Param('id') invoiceId: string,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    return await this.invoicesService.checkDuplicates(invoiceId, tenantId);
  }

  @Post(':id/finalize-validation')
  @ApiOperation({ summary: 'Finalizar validación y guardar factura' })
  async finalizeValidation(
    @Param('id') invoiceId: string,
    @Body() validationData: any,
    @GetUser() user: any,
  ) {
    if (!user.tenantId || !user.tenantId._id) {
      throw new BadRequestException('Usuario no tiene tenantId asignado');
    }

    const tenantId = user.tenantId._id.toString();
    return await this.invoicesService.finalizeValidation(invoiceId, tenantId, validationData);
  }
}
