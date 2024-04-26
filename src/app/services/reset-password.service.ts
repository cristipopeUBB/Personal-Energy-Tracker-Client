import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ResetPassword } from '../models/reset-password.model';

@Injectable({
  providedIn: 'root'
})
export class ResetPasswordService { // This service handles the "Reset Email" API endpoints calls
  private baseUrl: string = "https://localhost:7208/api/User";
  constructor(private httpClient: HttpClient) {

  }

  sendResetPasswordLink(email: string) {
    return this.httpClient.post<any>(`${this.baseUrl}/send-reset-email/${email}`, {});
  }

  resetPassword(resetPasswordObj: ResetPassword) {
    return this.httpClient.post<any>(`${this.baseUrl}/reset-password`, resetPasswordObj);
  }
}
