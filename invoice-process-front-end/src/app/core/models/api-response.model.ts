export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: Record<string, string[]>;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  message: string;
  timestamp: Date;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
  timestamp: Date;
}
