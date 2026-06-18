import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedCost?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  currentStock?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minStock?: number;

  @IsString()
  @IsOptional()
  warehouseLocation?: string;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedCost?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  currentStock?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minStock?: number;

  @IsString()
  @IsOptional()
  warehouseLocation?: string;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
