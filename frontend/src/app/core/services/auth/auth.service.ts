import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, map } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private appUrl: string;
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiUrl;
    this.appUrl = `api/auth`;
  }

  login(user: string, password: string) {
    return this.http.post<{ token: string, user?: { id: number, name: string, user: string, cargo?: string } }>(`${this.apiUrl}${this.appUrl}/login`, { user, password })
      .pipe(tap(res => {
        localStorage.setItem('token', res.token);
        if (res.user) localStorage.setItem('user', JSON.stringify(res.user));
      }));
  }

  logout() {
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getUserInfo(): { id?: number; name?: string; user?: string; role?: string;[key: string]: any } | null {
    // Preferir el usuario almacenado
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed;
      } catch { }
    }

    const token = localStorage.getItem('token');
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      // Base64URL decode
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      const payload = JSON.parse(json);
      const name = payload.name || payload.username || payload.email || payload.sub;
      const id = payload.id;
      const userField = payload.user;
      const role = payload.role || payload.rol || payload.profile || payload.tipo || payload.scope;
      return { ...payload, id, name, user: userField, role };
    } catch {
      return null;
    }
  }

  fetchMe() {
    return this.http.get<{ id: number, name: string, user: string, cargo?: string }>(`${this.apiUrl}${this.appUrl}/me`)
      .pipe(tap(me => localStorage.setItem('user', JSON.stringify(me))));
  }
}