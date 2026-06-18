export interface Settlement {
  _id?: string;
  userId: {
    _id: string;
    username: string;
    email: string;
  } | string;
  invoices: {
    _id: string;
    invoice_number: string;
    status: string;
    total: number;
    subtotal?: number;
    invoice_date?: Date;
  }[] | string[];
  total_additional_costs: number;
  calculated_base_total?: number;
  generation_date: Date;
  finalized_date?: Date;
  version: string;
  status: 'DRAFT' | 'FINALIZED' | 'CANCELLED';
  tenantId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Calculation data persisted to backend
  global_params?: SettlementGlobalParamsDTO;
  calculated_items?: CalculatedItemDTO[];
  destination_expenses?: DestinationExpenseDTO[];
  summary?: SettlementSummaryDTO;
}

export interface SettlementGlobalParams {
  fleteTotal: number;
  seguroTotal: number;
  variacionFletePct: number;
  fodinfaPct: number;
  isdPct: number;
  incrementoPct: number;
}

export interface SettlementLineCalc {
  // Source
  invoiceId: string;
  invoiceNumber: string;
  description: string;
  quantity: number;
  unitPrice: number;
  // Base
  total: number;
  distributionPct: number;
  // Import costs
  flete: number;
  seguro: number;
  cif: number;
  // Taxes
  arancelPct: number; // INPUT per line
  arancel: number;
  fodinfa: number;
  isd: number;
  // Costs
  costoTotal: number;
  costoVentasIndirectos: number; // INPUT
  valorUnitarioPlanta: number;
  // Pricing
  incrementoPct: number; // INPUT
  pvpSugerido: number;
  costoVentaPct: number;
  ganancia: number;
  contribucionPct: number;
}

export interface DestinationExpense {
  concepto: string;
  valor: number;
}

// --- Backend DTO shapes (snake_case, matching API) ---

export interface SettlementGlobalParamsDTO {
  flete_total: number;
  seguro_total: number;
  variacion_flete_pct: number;
  fodinfa_pct: number;
  isd_pct: number;
  incremento_pct: number;
}

export interface CalculatedItemDTO {
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
  arancel_pct: number;
  arancel: number;
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
}

export interface DestinationExpenseDTO {
  description: string;
  amount: number;
}

export interface SettlementSummaryDTO {
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
}

export interface SettlementCostBreakdown {
  taxes: number;
  logistics: number;
  insurance: number;
  customs: number;
  other: number;
}

export interface CreateSettlementRequest {
  userId: string;
  invoices?: string[];
  total_additional_costs?: number;
  generation_date?: Date;
  version?: string;
  status?: 'DRAFT' | 'FINALIZED' | 'CANCELLED';
}

export interface UpdateSettlementRequest {
  userId?: string;
  invoices?: string[];
  total_additional_costs?: number;
  generation_date?: Date;
  version?: string;
  status?: 'DRAFT' | 'FINALIZED' | 'CANCELLED';
  global_params?: SettlementGlobalParamsDTO;
  calculated_items?: CalculatedItemDTO[];
  destination_expenses?: DestinationExpenseDTO[];
  summary?: SettlementSummaryDTO;
}

export interface FinalizeSettlementResponse {
  success: boolean;
  message: string;
  settlement: Settlement;
  movementsCreated: number;
  productsUpdated: number;
  baseTotal: number;
  additionalCosts: number;
  totalCost: number;
}
