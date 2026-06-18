export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  profilePicture?: string;
  phone?: string;
  role: 'admin' | 'user' | 'analyst';
  tenantId: string;
  tenantName?: string;
  tenantSubdomain?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
}
