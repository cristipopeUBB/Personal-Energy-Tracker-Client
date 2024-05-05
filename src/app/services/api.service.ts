import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl: string = "https://localhost:7208/api/User/";
  private devicesUrl: string = "https://localhost:7208/api/Device/";
  private solarPanelsUrl: string = "https://localhost:7208/api/SolarPanel/";
  constructor(private http: HttpClient) { }

  getUsers() {
    return this.http.get<any>(this.baseUrl);
  }

  addDevice(data: any) {
    return this.http.post<any>(`${this.devicesUrl}add`, data);
  }

  addSolarPanel(data: any) {
    return this.http.post<any>(`${this.solarPanelsUrl}add`, data);
  }

  deleteSolarPanel(solarPanelId: number) {
    return this.http.delete<any>(`${this.solarPanelsUrl}delete?solarPanelId=${solarPanelId}`);
  }

  deleteDevice(deviceId: number) {
    return this.http.delete<any>(`${this.devicesUrl}delete?deviceId=${deviceId}`);
  }

  getUserDevices(userId: number) {
    return this.http.get<any>(`${this.devicesUrl}get?userId=${userId}`);
  }

  getUserSolarPanels(userId: number) {
    return this.http.get<any>(`${this.solarPanelsUrl}get?userId=${userId}`);
  }
}
