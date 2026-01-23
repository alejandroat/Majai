import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, map } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';


@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  
  private appUrl: string;
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiUrl;
    this.appUrl = `api/inventario`;
  }

  listarInventario() {
    return this.http.get<any[]>(`${this.apiUrl}${this.appUrl}/listar`);
  }

  inventarioId(id: number) {
    return this.http.get<any>(`${this.apiUrl}${this.appUrl}/ver/${id}`);
  }

  crearInventario(data: any) {
    // Si data es FormData, mantenerlo, sino convertirlo
    const payload = data instanceof FormData ? data : this.createFormData(data);
    return this.http.post<any>(`${this.apiUrl}${this.appUrl}/crear`, payload);
  }

  actualizarInventario(id: number, data: any) {
    // Si data es FormData, mantenerlo, sino convertirlo
    const payload = data instanceof FormData ? data : this.createFormData(data);
    return this.http.put<any>(`${this.apiUrl}${this.appUrl}/editar/${id}`, payload);
  }

  eliminarInventario(id: number) {
    return this.http.delete<any>(`${this.apiUrl}${this.appUrl}/eliminar/${id}`);
  }

  obtenerImagen(id: number) {
    return `${this.apiUrl}${this.appUrl}/imagen/${id}`;
  }

  private createFormData(data: any): FormData {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return formData;
  }

}