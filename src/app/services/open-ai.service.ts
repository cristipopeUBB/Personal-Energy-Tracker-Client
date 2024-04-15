import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpenAiService {
  private baseUrl:string ="https://localhost:7208/api/";
  constructor(private http: HttpClient) { }

  getData(input : string) : Observable<any> {
    return this.http.get(`${this.baseUrl}OpenAI/get-data?input=${input}`, {responseType: 'text'});
  }
}
