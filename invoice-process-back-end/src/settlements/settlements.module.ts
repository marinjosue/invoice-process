import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';
import { SettlementReportService } from './settlement-report.service';
import { Settlement, SettlementSchema } from './schemas/settlement.schema';
import { Invoice, InvoiceSchema } from '../invoices/schemas/invoice.schema';
import { InvoiceItem, InvoiceItemSchema } from '../invoices/schemas/invoice-item.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { InventoryMovement, InventoryMovementSchema } from '../inventory-movements/schemas/inventory-movement.schema';
import { Supplier, SupplierSchema } from '../suppliers/schemas/supplier.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { PdfStorageService } from '../services/pdf-storage.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { PersonsModule } from '../persons/persons.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Settlement.name, schema: SettlementSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: InvoiceItem.name, schema: InvoiceItemSchema },
      { name: Product.name, schema: ProductSchema },
      { name: InventoryMovement.name, schema: InventoryMovementSchema },
      { name: Supplier.name, schema: SupplierSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema },
    ]),
    // Necesarios para el populate anidado userId -> personaId / rolId
    PersonsModule,
    RolesModule,
  ],
  controllers: [SettlementsController],
  providers: [SettlementsService, SettlementReportService, PdfStorageService],
  exports: [SettlementsService],
})
export class SettlementsModule { }

