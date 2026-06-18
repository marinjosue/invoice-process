export interface Category {
  _id?: string;
  name: string;
  description?: string;
  code?: string;
  isActive: boolean;
  tenantId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  code?: string;
  isActive?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  code?: string;
  isActive?: boolean;
}
