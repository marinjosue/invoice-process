export interface Product {
  id: string;
  name: string;
  sku: string;
  providerId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'pending' | 'processed' | 'rejected' | 'settled';
  documentId: string;
  tenantId: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  providerId: string;
  quantity: number;
  unitPrice: number;
  documentId: string;
  notes?: string;
}

export interface UpdateProductRequest {
  name?: string;
  sku?: string;
  quantity?: number;
  unitPrice?: number;
  notes?: string;
}

export interface ExtractedProduct extends Product {
  confidence: number;
  extractedData: Record<string, any>;
}
