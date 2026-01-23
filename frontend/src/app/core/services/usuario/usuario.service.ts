import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private appUrl: string;
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiUrl;
    this.appUrl = `api/users`;
  }

  crearUsuario(data: any) {
    return this.http.post<any>(`${this.apiUrl}${this.appUrl}/crear`, data);
  }

  listarUsuarios() {
    return this.http.get<any[]>(`${this.apiUrl}${this.appUrl}/listar`);
  }

  usuarioId(id: number) {
    return this.http.get<any>(`${this.apiUrl}${this.appUrl}/ver/${id}`);
  }

  actualizarUsuario(id: number, data: any) {
    return this.http.put<any>(`${this.apiUrl}${this.appUrl}/actualizar/${id}`, data);
  }

  eliminarUsuario(id: number) {
    return this.http.delete<any>(`${this.apiUrl}${this.appUrl}/eliminar/${id}`);
  }
}
