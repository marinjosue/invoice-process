export interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  extractedProductCount: number;
  analysisResult?: AnalysisResult;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisResult {
  success: boolean;
  message: string;
  productsExtracted: number;
  confidence: number;
  errors?: string[];
}

export interface UploadDocumentResponse {
  documentId: string;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'analyzing';
  uploadedAt: Date;
}

export interface ExtractedProductData {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  confidence: number;
}
