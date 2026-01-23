import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class AbonoService {
  
  private appUrl: string;
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiUrl;
    this.appUrl = `api/abonos`;
   }

   crearAbono(data: any) {
    return this.http.post<any>(`${this.apiUrl}${this.appUrl}/crear`, data);
   }

   listarAbonos() {
    return this.http.get<any[]>(`${this.apiUrl}${this.appUrl}/listar`);
   }

   verAbonoId(id: number) {
    return this.http.get<any>(`${this.apiUrl}${this.appUrl}/ver/${id}`);
   }

   verAbonosPorAlquiler(idAlquiler: number) {
    return this.http.get<any>(`${this.apiUrl}${this.appUrl}/arrendamiento/${idAlquiler}`);
   }

   verAbonosPorUsuario(idUsuario: number) {
    return this.http.get<any>(`${this.apiUrl}${this.appUrl}/usuario/${idUsuario}`);
   }

   editarAbono(id: number, data: any) {
    return this.http.put<any>(`${this.apiUrl}${this.appUrl}/editar/${id}`, data);
   }

   eliminarAbono(id: number) {
    return this.http.delete<any>(`${this.apiUrl}${this.appUrl}/eliminar/${id}`);
   }



}
