import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryMovementsController } from './inventory-movements.controller';
import { InventoryMovementsService } from './inventory-movements.service';
import { InventoryMovement, InventoryMovementSchema } from './schemas/inventory-movement.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { PersonsModule } from '../persons/persons.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryMovement.name, schema: InventoryMovementSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
    ]),
    // Necesario para el populate anidado userId -> personaId
    PersonsModule,
  ],
  controllers: [InventoryMovementsController],
  providers: [InventoryMovementsService],
  exports: [InventoryMovementsService],
})
export class InventoryMovementsModule {}
