import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Settlement } from './schemas/settlement.schema';
import { Invoice } from '../invoices/schemas/invoice.schema';
import { InvoiceItem } from '../invoices/schemas/invoice-item.schema';
import { Product } from '../products/schemas/product.schema';
import { InventoryMovement, MovementType } from '../inventory-movements/schemas/inventory-movement.schema';
import { Supplier } from '../suppliers/schemas/supplier.schema';
import { Tenant } from '../tenants/schemas/tenant.schema';
import { CreateSettlementDto, UpdateSettlementDto, AddInvoiceToSettlementDto } from './dto/settlement.dto';
import { SettlementReportService, SettlementReportData } from './settlement-report.service';
import { PdfStorageService } from '../services/pdf-storage.service';

@Injectable()
export class SettlementsService {
  private readonly logger = new Logger(SettlementsService.name);

  constructor(
    @InjectModel(Settlement.name) private settlementModel: Model<Settlement>,
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(InvoiceItem.name) private invoiceItemModel: Model<InvoiceItem>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(InventoryMovement.name) private inventoryMovementModel: Model<InventoryMovement>,
    @InjectModel(Supplier.name) private supplierModel: Model<Supplier>,
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    private readonly reportService: SettlementReportService,
    private readonly pdfStorageService: PdfStorageService,
  ) { }

  async create(tenantId: string, createSettlementDto: CreateSettlementDto) {
    // 🔒 REGLA: Las liquidaciones SIEMPRE se crean en DRAFT
    // Solo el método finalize() puede cambiarlas a FINALIZED
    if (createSettlementDto.status && createSettlementDto.status !== 'DRAFT') {
      console.warn(`[CREATE SETTLEMENT] Intento de crear liquidación con estado ${createSettlementDto.status}, forzando a DRAFT`);
    }

    const invoiceIds = createSettlementDto.invoices?.map(id => new Types.ObjectId(id)) || [];

    const settlement = await this.settlementModel.create({
      ...createSettlementDto,
      status: 'DRAFT', // Forzar siempre DRAFT en creación
      tenantId: new Types.ObjectId(tenantId),
      userId: new Types.ObjectId(createSettlementDto.userId),
      invoices: invoiceIds,
    });

    return settlement;
  }

  async findAll(tenantId: string, filters?: any) {
    const query: any = { tenantId: new Types.ObjectId(tenantId) };

    if (filters?.userId) {
      query.userId = new Types.ObjectId(filters.userId);
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      query.generation_date = {};
      if (filters.startDate) {
        query.generation_date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.generation_date.$lte = new Date(filters.endDate);
      }
    }

    return this.settlementModel
      .find(query)
      .populate({
        path: 'userId',
        select: 'username',
        populate: { path: 'personaId', select: 'firstName lastName email' },
      })
      .populate('invoices', 'invoice_number status total')
      .sort({ generation_date: -1 });
  }

  async findOne(id: string, tenantId: string) {
    const settlement = await this.settlementModel
      .findById(id)
      .populate({
        path: 'userId',
        select: 'username',
        populate: [
          { path: 'personaId', select: 'firstName lastName email' },
          { path: 'rolId', select: 'name' },
        ],
      })
      .populate('invoices', 'invoice_number status total subtotal invoice_date');

    if (!settlement) {
      throw new NotFoundException('Liquidación no encontrada');
    }

    if (settlement.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado para ver esta liquidación');
    }

    return settlement;
  }

  async update(id: string, tenantId: string, updateSettlementDto: UpdateSettlementDto) {
    const settlement = await this.settlementModel.findById(id);

    if (!settlement) {
      throw new NotFoundException('Liquidación no encontrada');
    }

    if (settlement.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado');
    }

    // 🔒 REGLA: No se puede editar una liquidación FINALIZED
    if (settlement.status === 'FINALIZED') {
      throw new BadRequestException('No se puede editar una liquidación finalizada');
    }

    // 🔒 REGLA: No se puede cambiar manualmente a FINALIZED
    // Solo el método finalize() puede hacer eso
    if (updateSettlementDto.status === 'FINALIZED') {
      throw new BadRequestException(
        'No se puede cambiar manualmente a FINALIZED. Use el endpoint /finalize'
      );
    }

    const updateData: any = { ...updateSettlementDto };

    if (updateSettlementDto.userId) {
      updateData.userId = new Types.ObjectId(updateSettlementDto.userId);
    }

    if (updateSettlementDto.invoices) {
      updateData.invoices = updateSettlementDto.invoices.map(id => new Types.ObjectId(id));
    }

    const updated = await this.settlementModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate({
        path: 'userId',
        select: 'username',
        populate: { path: 'personaId', select: 'firstName lastName email' },
      })
      .populate('invoices', 'invoice_number status total');

    return updated;
  }

  async delete(id: string, tenantId: string) {
    const settlement = await this.settlementModel.findById(id);

    if (!settlement) {
      throw new NotFoundException('Liquidación no encontrada');
    }

    if (settlement.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado');
    }

    await settlement.deleteOne();
    return { deleted: true };
  }

  async addInvoice(id: string, tenantId: string, addInvoiceDto: AddInvoiceToSettlementDto) {
    const settlement = await this.settlementModel.findById(id);

    if (!settlement) {
      throw new NotFoundException('Liquidación no encontrada');
    }

    if (settlement.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado');
    }

    const invoiceId = new Types.ObjectId(addInvoiceDto.invoiceId);

    if (settlement.invoices.some(inv => inv.toString() === invoiceId.toString())) {
      throw new BadRequestException('La factura ya está en esta liquidación');
    }

    settlement.invoices.push(invoiceId);
    await settlement.save();

    return this.findOne(id, tenantId);
  }

  async removeInvoice(id: string, tenantId: string, invoiceId: string) {
    const settlement = await this.settlementModel.findById(id);

    if (!settlement) {
      throw new NotFoundException('Liquidación no encontrada');
    }

    if (settlement.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado');
    }

    settlement.invoices = settlement.invoices.filter(
      inv => inv.toString() !== invoiceId
    );

    await settlement.save();

    return this.findOne(id, tenantId);
  }

  async getStatistics(tenantId: string) {
    const settlements = await this.settlementModel.find({
      tenantId: new Types.ObjectId(tenantId),
    });

    const total = settlements.length;
    const byStatus = settlements.reduce((acc, settlement) => {
      acc[settlement.status] = (acc[settlement.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalCosts = settlements.reduce((sum, settlement) => {
      return sum + (settlement.total_additional_costs || 0);
    }, 0);

    return {
      total,
      byStatus,
      totalCosts,
    };
  }

  /**
   * 🔥 FINALIZAR LIQUIDACIÓN - Lógica completa de cálculo y actualización
   * 
   * 1. Valida que esté en DRAFT
   * 2. Valida que todas las facturas estén VALIDATED o FINALIZED
   * 3. Obtiene todos los INVOICE_ITEM
   * 4. Calcula total base
   * 5. Prorratea costos adicionales
   * 6. Actualiza estimated_cost de productos
   * 7. Crea movimientos de inventario ENTRY
   * 8. Actualiza current_stock
   * 9. Marca settlement como FINALIZED
   */
  async finalize(id: string, tenantId: string, userId: string) {
    const settlement = await this.settlementModel
      .findById(id)
      .populate('invoices');

    if (!settlement) {
      throw new NotFoundException('Liquidación no encontrada');
    }

    if (settlement.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado');
    }

    // 1. Validar estado
    if (settlement.status === 'FINALIZED') {
      throw new BadRequestException('La liquidación ya está finalizada');
    }

    if (settlement.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden finalizar liquidaciones en estado DRAFT');
    }

    if (!settlement.invoices || settlement.invoices.length === 0) {
      throw new BadRequestException('La liquidación debe tener al menos una factura');
    }

    // 2. Validar que todas las facturas estén VALIDATED o FINALIZED
    const invoiceIds = settlement.invoices.map(inv =>
      typeof inv === 'object' && '_id' in inv ? inv._id : inv
    );

    const invoices = await this.invoiceModel.find({
      _id: { $in: invoiceIds }
    });

    const invalidInvoices = invoices.filter(
      inv => inv.status !== 'VALIDATED' && inv.status !== 'FINALIZED'
    );

    if (invalidInvoices.length > 0) {
      throw new BadRequestException(
        `Todas las facturas deben estar VALIDATED o FINALIZED. Facturas inválidas: ${invalidInvoices.map(i => i.invoiceNumber).join(', ')}`
      );
    }

    // 3. Obtener todos los INVOICE_ITEM
    const invoiceItems = await this.invoiceItemModel.find({
      invoiceId: { $in: invoiceIds }
    });

    console.log('📦 [FINALIZE] Invoice Items encontrados:', invoiceItems.length);
    console.log('📦 [FINALIZE] Muestra de items:', invoiceItems.slice(0, 3).map(i => ({
      sku: i.sku,
      quantity: i.quantity,
      totalLine: i.totalLine
    })));

    if (invoiceItems.length === 0) {
      throw new BadRequestException('No se encontraron items en las facturas seleccionadas');
    }

    // 4. Calcular total base (suma de todos los totalLine)
    const baseTotal = invoiceItems.reduce((sum, item) => sum + (item.totalLine || 0), 0);

    if (baseTotal === 0) {
      throw new BadRequestException('El total base de las facturas es 0');
    }

    // 5. Prorratear costos adicionales por producto
    const additionalCosts = settlement.total_additional_costs || 0;

    // Agrupar items por producto (SKU)
    const itemsBySku = new Map<string, typeof invoiceItems>();
    invoiceItems.forEach(item => {
      if (!item.sku) {
        console.warn(`⚠️ [FINALIZE] Item sin SKU encontrado:`, item);
        return;
      }
      if (!itemsBySku.has(item.sku)) {
        itemsBySku.set(item.sku, []);
      }
      itemsBySku.get(item.sku)!.push(item);
    });

    console.log('📊 [FINALIZE] SKUs únicos encontrados:', itemsBySku.size);
    console.log('📊 [FINALIZE] Lista de SKUs:', Array.from(itemsBySku.keys()));

    if (itemsBySku.size === 0) {
      throw new BadRequestException('No se encontraron items con SKU válido en las facturas');
    }

    // 6-8. Por cada producto: calcular costo, actualizar estimated_cost, crear movimiento, actualizar stock
    const movementsCreated: InventoryMovement[] = [];

    for (const [sku, items] of itemsBySku.entries()) {
      // Sumar cantidades y costos de todos los items del mismo SKU
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const productTotalLine = items.reduce((sum, item) => sum + item.totalLine, 0);

      // Calcular costo prorrateado
      const factor = productTotalLine / baseTotal;
      const additionalCostForProduct = factor * additionalCosts;

      // Costo unitario real = (total_line + costos_prorrateados) / cantidad
      const realUnitCost = (productTotalLine + additionalCostForProduct) / totalQuantity;

      // Buscar producto por SKU
      const product = await this.productModel.findOne({
        tenantId: settlement.tenantId,
        sku: sku
      });

      if (!product) {
        console.error(`[FINALIZE] Producto con SKU '${sku}' no encontrado en tenant ${settlement.tenantId}`);
        console.error(`[FINALIZE] Items afectados:`, items.map(i => ({ quantity: i.quantity, totalLine: i.totalLine })));
        continue;
      }

      console.log(`[FINALIZE] Procesando SKU '${sku}': ${totalQuantity} unidades, costo real: $${realUnitCost.toFixed(2)}`);

      // Actualizar estimated_cost del producto
      const previousCost = product.estimatedCost;
      const previousStock = product.currentStock || 0;
      const newStock = previousStock + totalQuantity;

      await this.productModel.findByIdAndUpdate(product._id, {
        estimatedCost: realUnitCost,
        currentStock: newStock
      });

      // Crear movimiento de inventario ENTRY
      const movement = await this.inventoryMovementModel.create({
        tenantId: settlement.tenantId,
        productId: product._id,
        userId: new Types.ObjectId(userId),
        type: MovementType.ENTRY,
        quantity: totalQuantity,
        previousStock: previousStock,
        newStock: newStock,
        movementDate: settlement.generation_date || new Date(),
        reason: `Liquidación finalizada - Settlement #${settlement._id}`,
        settlementId: settlement._id,
        notes: `Costo anterior: $${previousCost.toFixed(2)}, Nuevo costo: $${realUnitCost.toFixed(2)}`
      });

      console.log(`[FINALIZE] Movimiento creado para SKU '${sku}': Stock ${previousStock} -> ${newStock}`);

      movementsCreated.push(movement);
    }

    console.log(`[FINALIZE] Finalizacion completada: ${movementsCreated.length} movimientos creados de ${itemsBySku.size} SKUs`);

    // 9. Actualizar settlement a FINALIZED
    settlement.status = 'FINALIZED';
    settlement.finalized_date = new Date();
    settlement.calculated_base_total = baseTotal;
    await settlement.save();

    return {
      settlement,
      movementsCreated: movementsCreated.length,
      productsUpdated: itemsBySku.size,
      baseTotal,
      additionalCosts,
      totalCost: baseTotal + additionalCosts
    };
  }

  /**
   * Generar reporte PDF de una liquidación y subirlo a GCS
   */
  async generateReport(id: string, tenantId: string): Promise<{ signedUrl: string; gcsPath: string }> {
    // 1. Cargar settlement con user (los datos personales viven en Persona)
    const settlement = await this.settlementModel
      .findById(id)
      .populate({
        path: 'userId',
        populate: { path: 'personaId', select: 'firstName lastName email' },
      });

    if (!settlement) {
      throw new NotFoundException('Liquidación no encontrada');
    }

    if (settlement.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado para generar reporte de esta liquidación');
    }

    // 2. Cargar tenant info
    const tenant = await this.tenantModel.findById(tenantId);
    const tenantName = tenant?.name || 'Empresa';

    // 3. Construir datos para el reporte desde los campos almacenados
    const user = settlement.userId as any;
    const persona = user?.personaId;
    const userName = persona?.firstName
      ? `${persona.firstName} ${persona.lastName || ''}`
      : 'N/A';

    const defaultParams = {
      flete_total: 0, seguro_total: 0, variacion_flete_pct: 10,
      fodinfa_pct: 0.5, isd_pct: 5, incremento_pct: 145,
    };

    // 3b. Compute summary from calculated_items if not stored
    const items = settlement.calculated_items || [];
    const destExp = settlement.destination_expenses || [];
    const storedSummary = settlement.summary || {} as any;

    const hasSummary = storedSummary.gran_total && storedSummary.gran_total > 0;

    const computedSummary = hasSummary ? storedSummary : {
      total_fob: items.reduce((s, i) => s + (i.total_fob || 0), 0),
      total_flete: items.reduce((s, i) => s + (i.flete || 0), 0),
      total_seguro: items.reduce((s, i) => s + (i.seguro || 0), 0),
      total_cif: items.reduce((s, i) => s + (i.cif || 0), 0),
      total_arancel: items.reduce((s, i) => s + (i.arancel || 0), 0),
      total_fodinfa: items.reduce((s, i) => s + (i.fodinfa || 0), 0),
      total_isd: items.reduce((s, i) => s + (i.isd || 0), 0),
      total_costos: items.reduce((s, i) => s + (i.costo_total || 0), 0),
      gastos_destino: destExp.reduce((s, e) => s + (e.amount || 0), 0),
      gran_total: items.reduce((s, i) => s + (i.costo_total || 0), 0) +
        destExp.reduce((s, e) => s + (e.amount || 0), 0),
    };

    const reportData: SettlementReportData = {
      settlementId: settlement._id.toString(),
      tenantName,
      status: settlement.status,
      generationDate: settlement.generation_date,
      finalizedDate: settlement.finalized_date,
      createdByUser: userName,
      global_params: { ...defaultParams, ...settlement.global_params },
      calculated_items: items,
      destination_expenses: destExp,
      summary: computedSummary,
    };

    // 4. Generar PDF
    this.logger.log(`Generando reporte PDF para liquidación ${id}`);
    const pdfBuffer = await this.reportService.generatePdf(reportData);

    // 5. Subir a GCS
    const fakeFile = {
      buffer: pdfBuffer,
      originalname: `liquidacion-${id}.pdf`,
      mimetype: 'application/pdf',
    } as Express.Multer.File;

    const uploadResult = await this.pdfStorageService.uploadPdf(fakeFile, 'reports');

    // 6. Guardar ruta en settlement
    await this.settlementModel.findByIdAndUpdate(id, {
      reportPath: uploadResult.gcsPath,
    });

    this.logger.log(`Reporte generado y subido: ${uploadResult.gcsPath}`);

    return {
      signedUrl: uploadResult.signedUrl,
      gcsPath: uploadResult.gcsPath,
    };
  }

  /**
   * Obtener URL firmada del reporte existente
   */
  async getReport(id: string, tenantId: string): Promise<{ signedUrl: string; gcsPath: string }> {
    const settlement = await this.settlementModel.findById(id);

    if (!settlement) {
      throw new NotFoundException('Liquidación no encontrada');
    }

    if (settlement.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No autorizado');
    }

    if (!settlement.reportPath) {
      // Generar si no existe
      return this.generateReport(id, tenantId);
    }

    // Generar nueva URL firmada para el reporte existente
    const signedUrl = await this.pdfStorageService.getSignedUrl(settlement.reportPath, 60);

    return {
      signedUrl,
      gcsPath: settlement.reportPath,
    };
  }
}
