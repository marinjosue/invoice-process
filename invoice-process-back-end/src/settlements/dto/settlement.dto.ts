import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, IsDateString, IsEnum, Min, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class GlobalParamsDto {
  @IsNumber() @IsOptional() flete_total?: number;
  @IsNumber() @IsOptional() seguro_total?: number;
  @IsNumber() @IsOptional() variacion_flete_pct?: number;
  @IsNumber() @IsOptional() fodinfa_pct?: number;
  @IsNumber() @IsOptional() isd_pct?: number;
  @IsNumber() @IsOptional() incremento_pct?: number;
}

class CalculatedItemDto {
  @IsString() @IsOptional() invoice_id?: string;
  @IsString() @IsOptional() invoice_number?: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @IsOptional() quantity?: number;
  @IsNumber() @IsOptional() unit_price?: number;
  @IsNumber() @IsOptional() total_fob?: number;
  @IsNumber() @IsOptional() distribution_pct?: number;
  @IsNumber() @IsOptional() flete?: number;
  @IsNumber() @IsOptional() seguro?: number;
  @IsNumber() @IsOptional() cif?: number;
  @IsNumber() @IsOptional() arancel?: number;
  @IsNumber() @IsOptional() arancel_pct?: number;
  @IsNumber() @IsOptional() fodinfa?: number;
  @IsNumber() @IsOptional() isd?: number;
  @IsNumber() @IsOptional() costo_total?: number;
  @IsNumber() @IsOptional() costo_ventas_indirectos?: number;
  @IsNumber() @IsOptional() valor_unitario_planta?: number;
  @IsNumber() @IsOptional() incremento_pct?: number;
  @IsNumber() @IsOptional() pvp_sugerido?: number;
  @IsNumber() @IsOptional() costo_venta_pct?: number;
  @IsNumber() @IsOptional() ganancia?: number;
  @IsNumber() @IsOptional() contribucion_pct?: number;
}

class DestinationExpenseDto {
  @IsString() @IsOptional() description?: string;
  @IsNumber() @IsOptional() amount?: number;
}

class SummaryDto {
  @IsNumber() @IsOptional() total_fob?: number;
  @IsNumber() @IsOptional() total_flete?: number;
  @IsNumber() @IsOptional() total_seguro?: number;
  @IsNumber() @IsOptional() total_cif?: number;
  @IsNumber() @IsOptional() total_arancel?: number;
  @IsNumber() @IsOptional() total_fodinfa?: number;
  @IsNumber() @IsOptional() total_isd?: number;
  @IsNumber() @IsOptional() total_costos?: number;
  @IsNumber() @IsOptional() gastos_destino?: number;
  @IsNumber() @IsOptional() gran_total?: number;
}

export class CreateSettlementDto {
  @IsString() @IsNotEmpty() userId: string;
  @IsArray() @IsOptional() invoices?: string[];
  @IsNumber() @IsOptional() @Min(0) total_additional_costs?: number;
  @IsDateString() @IsOptional() generation_date?: Date;
  @IsString() @IsOptional() version?: string;
  @IsEnum(['DRAFT', 'FINALIZED', 'CANCELLED']) @IsOptional() status?: string;

  @IsObject() @IsOptional() @ValidateNested() @Type(() => GlobalParamsDto)
  global_params?: GlobalParamsDto;
  @IsArray() @IsOptional() @ValidateNested({ each: true }) @Type(() => CalculatedItemDto)
  calculated_items?: CalculatedItemDto[];
  @IsArray() @IsOptional() @ValidateNested({ each: true }) @Type(() => DestinationExpenseDto)
  destination_expenses?: DestinationExpenseDto[];
  @IsObject() @IsOptional() @ValidateNested() @Type(() => SummaryDto)
  summary?: SummaryDto;
}

export class UpdateSettlementDto {
  @IsString() @IsOptional() userId?: string;
  @IsArray() @IsOptional() invoices?: string[];
  @IsNumber() @IsOptional() @Min(0) total_additional_costs?: number;
  @IsDateString() @IsOptional() generation_date?: Date;
  @IsString() @IsOptional() version?: string;
  @IsEnum(['DRAFT', 'FINALIZED', 'CANCELLED']) @IsOptional() status?: string;

  @IsObject() @IsOptional() @ValidateNested() @Type(() => GlobalParamsDto)
  global_params?: GlobalParamsDto;
  @IsArray() @IsOptional() @ValidateNested({ each: true }) @Type(() => CalculatedItemDto)
  calculated_items?: CalculatedItemDto[];
  @IsArray() @IsOptional() @ValidateNested({ each: true }) @Type(() => DestinationExpenseDto)
  destination_expenses?: DestinationExpenseDto[];
  @IsObject() @IsOptional() @ValidateNested() @Type(() => SummaryDto)
  summary?: SummaryDto;
}

export class AddInvoiceToSettlementDto {
  @IsString() @IsNotEmpty() invoiceId: string;
}

export class RemoveInvoiceFromSettlementDto {
  @IsString() @IsNotEmpty() invoiceId: string;
}

export class FinalizeSettlementDto { }
