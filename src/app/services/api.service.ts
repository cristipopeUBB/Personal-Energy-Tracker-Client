import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl: string = "https://localhost:7208/api/User/";
  private devicesUrl: string = "https://localhost:7208/api/Device/";
  constructor(private http: HttpClient) { }

  getUsers() {
    return this.http.get<any>(this.baseUrl);
  }

  addDevice(data: any) {
    return this.http.post<any>(`${this.devicesUrl}add`, data);
  }

  deleteDevice(deviceId: number) {
    return this.http.delete<any>(`${this.devicesUrl}delete?deviceId=${deviceId}`);
  }

  getUserDevices(userId: number) {
    return this.http.get<any>(`${this.devicesUrl}get?userId=${userId}`);
  }
}
