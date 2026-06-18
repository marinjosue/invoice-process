import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';
import { MovementType } from '../schemas/inventory-movement.schema';

export class CreateInventoryMovementDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsEnum(MovementType)
  @IsNotEmpty()
  type: MovementType;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  invoiceId?: string;

  @IsString()
  @IsOptional()
  settlementId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  movementDate?: Date;
}

export class UpdateInventoryMovementDto {
  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class InventoryMovementFiltersDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsEnum(MovementType)
  @IsOptional()
  type?: MovementType;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;
}
