import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Settlement extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Invoice' }], default: [] })
  invoices: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  total_additional_costs: number;

  @Prop({ type: Date, default: Date.now })
  generation_date: Date;

  @Prop({ type: String, default: '1.0' })
  version: string;

  @Prop({
    type: String,
    enum: ['DRAFT', 'FINALIZED', 'CANCELLED'],
    default: 'DRAFT'
  })
  status: string;

  @Prop({ type: Number, default: 0 })
  calculated_base_total: number;

  @Prop({ type: Date })
  finalized_date?: Date;

  @Prop({ type: String })
  reportPath?: string;

  // ─── Import Calculation Parameters ─────────────────────────
  // Field names match frontend SettlementGlobalParamsDTO

  @Prop({
    type: {
      flete_total: { type: Number, default: 0 },
      seguro_total: { type: Number, default: 0 },
      variacion_flete_pct: { type: Number, default: 10 },
      fodinfa_pct: { type: Number, default: 0.5 },
      isd_pct: { type: Number, default: 5 },
      incremento_pct: { type: Number, default: 145 },
    },
    default: {},
  })
  global_params: {
    flete_total: number;
    seguro_total: number;
    variacion_flete_pct: number;
    fodinfa_pct: number;
    isd_pct: number;
    incremento_pct: number;
  };

  // Field names match frontend CalculatedItemDTO
  @Prop({
    type: [{
      invoice_id: String,
      invoice_number: String,
      description: String,
      quantity: { type: Number, default: 0 },
      unit_price: { type: Number, default: 0 },
      total_fob: { type: Number, default: 0 },
      distribution_pct: { type: Number, default: 0 },
      flete: { type: Number, default: 0 },
      seguro: { type: Number, default: 0 },
      cif: { type: Number, default: 0 },
      arancel: { type: Number, default: 0 },
      arancel_pct: { type: Number, default: 0 },
      fodinfa: { type: Number, default: 0 },
      isd: { type: Number, default: 0 },
      costo_total: { type: Number, default: 0 },
      costo_ventas_indirectos: { type: Number, default: 0 },
      valor_unitario_planta: { type: Number, default: 0 },
      incremento_pct: { type: Number, default: 145 },
      pvp_sugerido: { type: Number, default: 0 },
      costo_venta_pct: { type: Number, default: 0 },
      ganancia: { type: Number, default: 0 },
      contribucion_pct: { type: Number, default: 0 },
    }],
    default: [],
  })
  calculated_items: Array<{
    invoice_id: string;
    invoice_number: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_fob: number;
    distribution_pct: number;
    flete: number;
    seguro: number;
    cif: number;
    arancel: number;
    arancel_pct: number;
    fodinfa: number;
    isd: number;
    costo_total: number;
    costo_ventas_indirectos: number;
    valor_unitario_planta: number;
    incremento_pct: number;
    pvp_sugerido: number;
    costo_venta_pct: number;
    ganancia: number;
    contribucion_pct: number;
  }>;

  @Prop({
    type: [{ description: String, amount: { type: Number, default: 0 } }],
    default: [],
  })
  destination_expenses: Array<{
    description: string;
    amount: number;
  }>;

  // Field names match frontend SettlementSummaryDTO
  @Prop({
    type: {
      total_fob: { type: Number, default: 0 },
      total_flete: { type: Number, default: 0 },
      total_seguro: { type: Number, default: 0 },
      total_cif: { type: Number, default: 0 },
      total_arancel: { type: Number, default: 0 },
      total_fodinfa: { type: Number, default: 0 },
      total_isd: { type: Number, default: 0 },
      total_costos: { type: Number, default: 0 },
      gastos_destino: { type: Number, default: 0 },
      gran_total: { type: Number, default: 0 },
    },
    default: {},
  })
  summary: {
    total_fob: number;
    total_flete: number;
    total_seguro: number;
    total_cif: number;
    total_arancel: number;
    total_fodinfa: number;
    total_isd: number;
    total_costos: number;
    gastos_destino: number;
    gran_total: number;
  };
}

export const SettlementSchema = SchemaFactory.createForClass(Settlement);

SettlementSchema.index({ tenantId: 1, generation_date: -1 });
SettlementSchema.index({ tenantId: 1, userId: 1 });
SettlementSchema.index({ tenantId: 1, status: 1 });
