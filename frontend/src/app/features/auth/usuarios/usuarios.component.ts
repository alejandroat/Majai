import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { UsuarioService } from '../../../core/services/usuario/usuario.service';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent, ConfirmDialogComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {

  currentUser: { id?: number; name?: string; user?: string } | null = null;
  users: Array<{ id: number; name: string; user: string }> = [];
  loading = false;
  error: string | null = null;

  modalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  form: FormGroup;
  submitting = false;
  selectedId: number | null = null;
  // Confirmación genérica
  confirmOpen = false;
  confirmTitle = 'Eliminar usuario';
  confirmMessage = '¿Deseas eliminar este usuario? Esta acción no se puede deshacer.';
  confirmText = 'Eliminar';
  cancelText = 'Cancelar';
  pendingDeleteId: number | null = null;

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      user: ['', Validators.required],
      password: [''],
      esAdmin: [false]
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadUsers();
  }

  loadCurrentUser(): void {
    this.currentUser = this.authService.getUserInfo();
    if (!this.currentUser || !this.currentUser.name) {
      this.authService.fetchMe().subscribe({
        next: (me) => this.currentUser = me,
        error: () => {}
      });
    }
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;
    this.usuarioService.listarUsuarios().subscribe({
      next: (rows) => {
        this.users = (rows || []).map((u: any) => ({ id: u.id, name: u.name, user: u.user }));
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo cargar el listado de usuarios';
        this.loading = false;
      }
    });
  }

  // Modal handlers
  openCreate(): void {
    this.modalMode = 'create';
    this.selectedId = null;
    this.form.reset({ name: '', user: '', password: '', esAdmin: false });
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.get('password')?.updateValueAndValidity();
    this.modalOpen = true;
  }

  openEdit(row: { id: number; name: string; user: string }): void {
    this.modalMode = 'edit';
    this.selectedId = row.id;
    this.form.reset({ name: row.name || '', user: row.user || '', password: '', esAdmin: false });
    this.form.get('password')?.setValidators([]);
    this.form.get('password')?.updateValueAndValidity();
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  submitForm(): void {
    if (this.form.invalid || this.submitting) return;
    this.submitting = true;
    const { name, user, password, esAdmin } = this.form.value;
    const payload: any = { 
      name, 
      user, 
      rol: esAdmin ? 'admin' : 'user'
    };
    if (password && password.trim()) payload.password = password;

    const observer = {
      next: () => {
        console.log('Usuario guardado exitosamente');
        this.submitting = false;
        this.closeModal();
        this.loadUsers();
      },
      error: (err: any) => {
        console.error(this.modalMode === 'create' ? 'Error creando usuario:' : 'Error actualizando usuario:', err);
        alert('Error: ' + (err.error?.message || err.message || 'No se pudo guardar el usuario'));
        this.submitting = false;
      }
    };

    if (this.modalMode === 'create') {
      console.log('Creando usuario con payload:', payload);
      this.usuarioService.crearUsuario(payload).subscribe(observer);
    } else if (this.modalMode === 'edit' && this.selectedId != null) {
      console.log('Actualizando usuario con payload:', payload);
      this.usuarioService.actualizarUsuario(this.selectedId, payload).subscribe(observer);
    }
  }

  deleteRow(row: { id: number }): void {
    this.pendingDeleteId = row.id;
    this.confirmOpen = true;
  }

  confirmDelete(): void {
    if (this.pendingDeleteId == null) { this.confirmOpen = false; return; }
    const id = this.pendingDeleteId;
    this.usuarioService.eliminarUsuario(id).subscribe({
      next: () => {
        this.confirmOpen = false;
        this.pendingDeleteId = null;
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error eliminando usuario', err);
        this.confirmOpen = false;
        this.pendingDeleteId = null;
      }
    });
  }

  closeConfirm(): void {
    this.confirmOpen = false;
    this.pendingDeleteId = null;
  }

  trackRow(index: number, user: any): number {
    return user.id; // o el campo único que tengas
  }
}
