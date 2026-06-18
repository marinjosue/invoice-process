import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice } from './schemas/invoice.schema';
import { InvoiceItem } from './schemas/invoice-item.schema';
import { GeminiService } from './gemini.service';
import { PdfStorageService } from '../services/pdf-storage.service';
import { ProductsService } from '../products/products.service';
import { SuppliersService } from '../suppliers/suppliers.service';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(InvoiceItem.name) private invoiceItemModel: Model<InvoiceItem>,
    private geminiService: GeminiService,
    private pdfStorageService: PdfStorageService,
    private productsService: ProductsService,
    private suppliersService: SuppliersService,
  ) { }

  async uploadAndProcess(file: Express.Multer.File, userId: string, tenantId: string) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten archivos PDF, Excel (.xlsx, .xls) o CSV');
    }

    // Crear copias separadas del buffer para evitar conflictos
    const originalBuffer = file.buffer;
    const gcsBuffer = Buffer.from(originalBuffer);
    const geminiBuffer = Buffer.from(originalBuffer);

    let gcsPath: string | null = null;
    let signedUrl: string | null = null;

    // Subir a Google Cloud Storage
    try {
      const uploadResult = await this.pdfStorageService.uploadPdf(
        { ...file, buffer: gcsBuffer },
        'invoices' 
      );

      gcsPath = uploadResult.gcsPath;
      signedUrl = uploadResult.signedUrl;
      
      this.logger.log(`Archivo subido a GCS: ${gcsPath}`);
    } catch (error) {
      this.logger.error('Error al subir archivo a Google Cloud Storage', error);
      throw new BadRequestException('Error al subir el archivo: ' + error.message);
    }

    const invoice = new this.invoiceModel({
      tenantId: new Types.ObjectId(tenantId),
      ubicacionArchivo: {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        gcsPath: gcsPath,
      },
      metadatosCarga: {
        uploadedBy: new Types.ObjectId(userId),
        uploadedAt: new Date()
      },
      status: 'PROCESSING'
    });

    await invoice.save();
    
    // Extraer datos con Gemini usando buffer separado
    const extractionResult = await this.geminiService.extractInvoiceDataFromBuffer(geminiBuffer, file.mimetype);

    if (extractionResult.success) {
      invoice.extractedJson = extractionResult.data;
      invoice.confianzaExtraccion = extractionResult.confidence;
      invoice.warnings = extractionResult.warnings;
      invoice.status = 'EXTRACTED';

      // Solo guardar datos básicos de cabecera
      if (extractionResult.data.cabecera) {
        invoice.invoiceNumber = extractionResult.data.cabecera.numeroFactura;
        invoice.invoiceDate = extractionResult.data.cabecera.fechaFactura;
        invoice.supplierName = extractionResult.data.cabecera.proveedorNombre;
        invoice.currency = extractionResult.data.cabecera.moneda || 'USD';
        invoice.subtotal = extractionResult.data.cabecera.subtotal || 0;
        invoice.tax = extractionResult.data.cabecera.impuestos || 0;
        invoice.total = extractionResult.data.cabecera.total || 0;
        invoice.notes = extractionResult.data.cabecera.observaciones;
      }

      await invoice.save();

      return {
        success: true,
        message: 'Invoice extracted successfully - ready for validation',
        invoiceId: invoice._id,
        status: invoice.status,
        extractedJson: invoice.extractedJson,
        confidence: invoice.confianzaExtraccion,
        warnings: invoice.warnings,
        fileUrl: signedUrl,
      };

    } else {
      invoice.status = 'ERROR';
      const errorMessage = 'error' in extractionResult ? extractionResult.error : 'Unknown error';
      invoice.processingErrors = [errorMessage];
      await invoice.save();

      throw new BadRequestException('Error processing invoice: ' + errorMessage);
    }
  }

  async findAll(tenantId: string, status?: string) {
    // Convertir tenantId a ObjectId para la consulta
    const filter: any = { tenantId: new Types.ObjectId(tenantId) };

    if (status) {
      filter.status = status;
    }
    const invoices = await this.invoiceModel.find(filter)
      .populate('metadatosCarga.uploadedBy', 'firstName lastName email')
      .populate('supplierId', 'name supplierId country currency')
      .sort({ createdAt: -1 });
    return invoices;
  }

  async findOne(id: string, tenantId: string) {
    const invoice = await this.invoiceModel.findById(id)
      .populate('metadatosCarga.uploadedBy', 'firstName lastName email')
      .populate('supplierId', 'name supplierId country currency taxId email');

    if (!invoice) {
      // Buscar si existe en cualquier tenant para debug
      const anyInvoice = await this.invoiceModel.findById(id);
      if (anyInvoice) {
        throw new ForbiddenException(`Esta factura pertenece a otra organización (Tenant: ${anyInvoice.tenantId})`);
      }
      throw new NotFoundException('Factura no encontrada');
    }

    // Verificar que la factura pertenece al tenant correcto
    if (invoice.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No tienes acceso a esta factura');
    }
    return invoice;
  }

  async update(id: string, tenantId: string, updateData: any) {
    const invoice = await this.invoiceModel.findById(id);

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    if (invoice.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('No tienes acceso a esta factura');
    }

    // Actualizar solo campos permitidos
    const allowedFields = ['status', 'notes', 'invoiceNumber', 'invoiceDate', 'supplierId', 'currency', 'subtotal', 'tax', 'total'];
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        invoice[key] = updateData[key];
      }
    });

    await invoice.save();
    return invoice;
  }

  async validate(id: string, tenantId: string, updateData: any) {
    const invoice = await this.invoiceModel.findById(id);

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    // Comparar ObjectIds correctamente
    if (invoice.tenantId.toString() !== tenantId.toString()) {
      throw new ForbiddenException('No autorizado');
    }

    if (updateData.invoiceNumber) invoice.invoiceNumber = updateData.invoiceNumber;
    if (updateData.invoiceDate) invoice.invoiceDate = updateData.invoiceDate;
    if (updateData.date) invoice.invoiceDate = updateData.date;
    if (updateData.supplierName) invoice.supplierName = updateData.supplierName;
    if (updateData.currency) invoice.currency = updateData.currency;
    if (updateData.subtotal !== undefined) invoice.subtotal = updateData.subtotal;
    if (updateData.total !== undefined) invoice.total = updateData.total;
    if (updateData.notes) invoice.notes = updateData.notes;

    // Crear o actualizar proveedor al validar
    if (updateData.supplierId) {
      // Usuario seleccionó proveedor existente
      invoice.supplierId = new Types.ObjectId(updateData.supplierId);
    } else if (invoice.supplierName || updateData.supplierName) {
      // Crear nuevo proveedor si no existe
      try {
        const supplier = await this.suppliersService.findOrCreate(
          tenantId,
          updateData.supplierName || invoice.supplierName,
          {
            country: updateData.country || 'N/A',
            currency: updateData.currency || invoice.currency || 'USD',
            taxId: updateData.taxId || '',
          }
        );
        invoice.supplierId = supplier._id;
      } catch (error) {
      }
    }

    if (updateData.items) {
      invoice.items = updateData.items;
    }

    // Crear productos solo al validar y guardar items con referencias
    const createdProductsValidate: Types.ObjectId[] = [];
    const updatedProductsValidate: Types.ObjectId[] = [];

    if (invoice.items && invoice.items.length > 0) {
      for (const item of invoice.items) {
        try {
          let productToUse: any = null;

          // Si ya tiene productId del frontend (usuario seleccionó existente)
          if (item.productId) {
            productToUse = await this.productsService.findById(item.productId.toString(), tenantId);
            if (productToUse) {
              updatedProductsValidate.push(productToUse._id);
            }
          } else {
            // Buscar por SKU o crear nuevo
            const existingProduct = item.sku ? await this.productsService.findBySKU(item.sku, tenantId) : null;

            if (existingProduct) {
              productToUse = existingProduct;
              item.productId = existingProduct._id;
              updatedProductsValidate.push(existingProduct._id);
            } else {
              // Crear producto nuevo
              const newProduct = await this.productsService.create(tenantId, {
                sku: item.sku || `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                description: item.description,
                unit: 'Unidad',
                estimatedCost: item.unitPrice || 0,
                currentStock: 0,
                minStock: 0,
              });
              productToUse = newProduct;
              item.productId = newProduct._id;
              createdProductsValidate.push(newProduct._id);
            }
          }

          // Crear InvoiceItem en colección separada
          await this.invoiceItemModel.create({
            invoiceId: invoice._id,
            itemId: item.itemId || `item-${invoice._id}-${Date.now()}`,
            productId: productToUse?._id,
            sku: item.sku || productToUse?.sku,
            description: item.description,
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice || 0,
            totalLine: item.totalLine || (item.quantity * item.unitPrice) || 0,
          });
        } catch (error) {
          this.logger.error(`Error procesando item: ${error.message}`, error.stack);
        }
      }
    }

    invoice.status = 'VALIDATED';
    await invoice.save();
    return {
      success: true,
      message: 'Invoice validated successfully',
      invoice,
      productsCreated: createdProductsValidate.length,
      productsUpdated: updatedProductsValidate.length,
      supplierCreated: !updateData.supplierId && invoice.supplierId ? true : false
    };
  }

  async delete(id: string, tenantId: string) {
    const invoice = await this.invoiceModel.findById(id);

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    if (invoice.tenantId.toString() !== tenantId.toString()) {
      throw new ForbiddenException('No autorizado');
    }

    if (invoice.status === 'VALIDATED' || invoice.status === 'FINALIZED' || invoice.status === 'APPROVED') {
      throw new BadRequestException(
        'No se puede eliminar una factura validada porque ya tiene items guardados en el sistema. ' +
        'Estado actual: ' + invoice.status
      );
    }

    // Eliminar archivo de Google Cloud Storage
    if (invoice.ubicacionArchivo?.gcsPath) {
      try {
        this.logger.log(`Eliminando archivo de GCS: ${invoice.ubicacionArchivo.gcsPath}`);
        await this.pdfStorageService.deletePdf(invoice.ubicacionArchivo.gcsPath);
        this.logger.log('Archivo eliminado exitosamente de Google Cloud Storage');
      } catch (error) {
        this.logger.error('Error al eliminar de Google Cloud Storage:', {
          gcsPath: invoice.ubicacionArchivo.gcsPath,
          error: error.message,
          stack: error.stack?.split('\n').slice(0, 3)
        });
        // Por ahora continuar, pero en producción podrías querer lanzar error
        this.logger.warn('Continuando con eliminación de la base de datos a pesar del error de GCS');
      }
    } else {
      this.logger.warn('No hay archivo en GCS para eliminar');
    }

    await invoice.deleteOne();

    return {
      success: true,
      message: 'Invoice deleted successfully'
    };
  }

  /**
   * Validate products by SKU and save invoice
   * - If product exists (by SKU) -> use same ID
   * - If it doesn't exist -> create new product
   */
  async validateAndSaveInvoice(invoiceData: any, tenantId: string, userId: string) {
    // Search for existing invoice or create new one
    let invoice = invoiceData._id
      ? await this.invoiceModel.findById(invoiceData._id)
      : null;

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Verify authorization
    if (invoice.tenantId.toString() !== tenantId) {
      throw new ForbiddenException('Not authorized to modify this invoice');
    }

    // Update header data
    invoice.invoiceNumber = invoiceData.invoiceNumber;
    invoice.invoiceDate = invoiceData.invoiceDate;
    invoice.supplierName = invoiceData.supplierName;
    invoice.currency = invoiceData.currency || 'USD';
    invoice.subtotal = invoiceData.subtotal || 0;
    invoice.tax = invoiceData.tax || 0;
    invoice.total = invoiceData.total || 0;
    invoice.notes = invoiceData.notes;

    // Validate and process items
    const validatedItems: any[] = [];
    const createdProducts: any[] = [];
    const matchedProducts: any[] = [];

    for (const item of invoiceData.items) {
      let product: any = null;
      let isNew = false;

      // 1. Search for existing product by SKU
      if (item.sku) {
        try {
          product = await this.productsService.findBySKU(item.sku, tenantId);

          if (product) {
            matchedProducts.push(product);
          }
        } catch (error) {
          this.logger.debug(`Product not found with SKU: ${item.sku}`);
        }
      }

      // 2. Create new product if it doesn't exist
      if (!product) {
        const newProductData = {
          sku: item.sku || `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          description: item.description,
          unit: 'UND',
          estimatedCost: item.unitPrice || 0,
          currentStock: 0,
          minStock: 0,
          supplierId: invoice.supplierId ? invoice.supplierId.toString() : undefined,
        };

        product = await this.productsService.create(tenantId, newProductData);
        isNew = true;
        createdProducts.push(product);
      }

      // 3. Add validated item with productId
      validatedItems.push({
        itemId: item.itemId,
        productId: product._id,
        sku: product.sku,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalLine: item.totalLine,
        isNew: isNew
      });
    }

    // Guardar items validados
    invoice.items = validatedItems;
    invoice.status = 'VALIDATED';
    await invoice.save();
    return {
      ...invoice.toObject(),
      stats: {
        productsCreated: createdProducts.length,
        productsMatched: matchedProducts.length,
        totalItems: validatedItems.length
      }
    };
  }

  async checkDuplicates(invoiceId: string, tenantId: string) {
    const invoice = await this.invoiceModel.findOne({
      _id: invoiceId,
      tenantId: new Types.ObjectId(tenantId)
    }).populate('supplierId');

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    const duplicates = {
      supplier: {
        exists: !!invoice.supplierId,
        data: invoice.supplierId || null,
        message: invoice.supplierId 
          ? `Proveedor ya existe: ${(invoice.supplierId as any).name}`
          : 'Nuevo proveedor'
      },
      items: [] as any[]
    };

    // Verificar items si existen
    if (invoice.extractedJson?.items) {
      for (const item of invoice.extractedJson.items) {
        const sku = item.codigoProducto || `AUTO-${invoiceId}-${item.descripcion}`;
        const existingProduct = await this.productsService.findBySKU(sku, tenantId);

        duplicates.items.push({
          description: item.descripcion,
          sku: sku,
          exists: !!existingProduct,
          productId: existingProduct?._id || null,
          message: existingProduct 
            ? `Producto ya existe: ${existingProduct.description}`
            : 'Nuevo producto'
        });
      }
    }

    return {
      success: true,
      duplicates,
      warning: duplicates.supplier.exists ? 'Se reutilizará proveedor existente' : '',
    };
  }

  async finalizeValidation(invoiceId: string, tenantId: string, validationData: any) {
    const invoice = await this.invoiceModel.findOne({
      _id: invoiceId,
      tenantId: new Types.ObjectId(tenantId)
    });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    // Actualizar datos validados
    invoice.invoiceNumber = validationData.invoiceNumber;
    invoice.invoiceDate = validationData.date;
    invoice.total = validationData.total;
    invoice.status = 'VALIDATED';

    // Si se proporciona un supplierId, usarlo
    if (validationData.supplierId) {
      invoice.supplierId = new Types.ObjectId(validationData.supplierId);
    }

    // Guardar items validados si vienen en los datos
    if (validationData.items && validationData.items.length > 0) {
      const items: any[] = [];
      
      for (let index = 0; index < validationData.items.length; index++) {
        const itemData = validationData.items[index];
        
        // Crear objeto completo del item con la estructura esperada
        const itemObject = {
          itemId: `item-${invoiceId}-${index + 1}`,
          productId: itemData.productId ? new Types.ObjectId(itemData.productId) : undefined,
          sku: itemData.sku || `AUTO-${invoiceId}-${index}`,
          description: itemData.productName || itemData.description || '',
          quantity: itemData.quantity || 0,
          unitPrice: itemData.unitPrice || 0,
          totalLine: itemData.totalPrice || itemData.totalLine || 0
        };
        
        items.push(itemObject);
      }
      
      invoice.items = items;
    }

    await invoice.save();

    return {
      success: true,
      invoice,
      message: 'Factura validada y guardada correctamente'
    };
  }

  async getFileUrl(invoiceId: string, tenantId: string, mode: 'view' | 'download' = 'view') {
    const invoice = await this.findOne(invoiceId, tenantId);

    const gcsPath = invoice.ubicacionArchivo?.gcsPath;
    if (!gcsPath) throw new NotFoundException('La factura no tiene archivo asociado');

    const url = await this.pdfStorageService.getSignedUrl(
      gcsPath,
      30,
      mode === 'download' ? 'attachment' : 'inline',
    );

    return { url };
  }
}

