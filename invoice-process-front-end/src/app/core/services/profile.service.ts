import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  role: string;
  tenantId: any;
  createdAt: Date;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/profile`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<{ success: boolean; user: UserProfile }> {
    return this.http.get<{ success: boolean; user: UserProfile }>(this.apiUrl);
  }

  updateProfile(data: UpdateProfileRequest): Observable<any> {
    return this.http.put(this.apiUrl, data);
  }

  uploadProfilePicture(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put(`${this.apiUrl}/picture`, formData);
  }
}
