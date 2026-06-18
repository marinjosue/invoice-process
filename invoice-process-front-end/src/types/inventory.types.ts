export enum MovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  ADJUSTMENT = 'ADJUSTMENT'
}

export interface InventoryMovement {
  _id?: string;
  productId: {
    _id: string;
    sku: string;
    description: string;
    unit: string;
    currentStock?: number;
  } | string;
  userId: {
    _id: string;
    username: string;
    email: string;
  } | string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  movementDate: Date;
  reason: string;
  invoiceId?: {
    _id: string;
    invoice_number: string;
    status: string;
  } | string;
  settlementId?: {
    _id: string;
  } | string;
  notes?: string;
  tenantId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateInventoryMovementRequest {
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  invoiceId?: string;
  settlementId?: string;
  notes?: string;
  movementDate?: Date;
}

export interface UpdateInventoryMovementRequest {
  notes?: string;
  reason?: string;
}
