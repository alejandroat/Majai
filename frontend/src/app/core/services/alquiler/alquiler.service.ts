import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class AlquilerService {

  private appUrl: string;
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiUrl;
    this.appUrl = `api/arrendamiento`;
  }

  crearAlquiler(data: any) {
    return this.http.post<any>(`${this.apiUrl}${this.appUrl}/crear`, data);
  }

  crearAlquilerSinPDF(data: any) {
    return this.http.post<any>(`${this.apiUrl}${this.appUrl}/crear-sin-pdf`, data);
  }
  
  listarAlquileres() {
    return this.http.get<any[]>(`${this.apiUrl}${this.appUrl}/listar`);
  }

  verAlquilerId(id: number) {
    return this.http.get<any>(`${this.apiUrl}${this.appUrl}/ver/${id}`);
  }

  verAlquilerPorVestido(idVestido: number) {
    return this.http.get<any>(`${this.apiUrl}${this.appUrl}/vestido/${idVestido}`);
  }

  editarAlquiler(id: number, data: any) {
    return this.http.put<any>(`${this.apiUrl}${this.appUrl}/editar/${id}`, data);
  }

  eliminarAlquiler(id: number) {
    return this.http.delete<any>(`${this.apiUrl}${this.appUrl}/eliminar/${id}`);
  }

  crearPDFAlquiler(data: any) {
    return this.http.post<any>(`${this.apiUrl}${this.appUrl}/crearpdf`, data);
  }
}
