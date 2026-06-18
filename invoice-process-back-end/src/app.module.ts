import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InvoicesModule } from './invoices/invoices.module';
import { TenantsModule } from './tenants/tenants.module';
import { ProductsModule } from './products/products.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CategoriesModule } from './categories/categories.module';
import { SettlementsModule } from './settlements/settlements.module';
import { InventoryMovementsModule } from './inventory-movements/inventory-movements.module';
import { PdfModule } from './modules/pdf.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { DashboardController } from './controllers/dashboard.controller';
import { Invoice, InvoiceSchema } from './invoices/schemas/invoice.schema';
import { Product, ProductSchema } from './products/schemas/product.schema';
import { Supplier, SupplierSchema } from './suppliers/schemas/supplier.schema';
import { Settlement, SettlementSchema } from './settlements/schemas/settlement.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO || 'mongodb://localhost/liquidaciones'),
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Supplier.name, schema: SupplierSchema },
      { name: Settlement.name, schema: SettlementSchema },
    ]),
    AuthModule,
    UsersModule,
    InvoicesModule,
    TenantsModule,
    ProductsModule,
    SuppliersModule,
    CategoriesModule,
    SettlementsModule,
    InventoryMovementsModule,
    PdfModule,
    AdminUsersModule,
  ],
  controllers: [DashboardController],
})
export class AppModule {}
