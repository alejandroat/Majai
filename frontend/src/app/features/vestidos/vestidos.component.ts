import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { InventarioService } from '../../core/services/inventario/inventario.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { AlquilerService } from '../../core/services/alquiler/alquiler.service';
import { QrScannerComponent } from '../../shared/qr-scanner/qr-scanner.component';
import { QrService } from '../../core/services/qr/qr.service';
import { NotificationDialogComponent } from '../../shared/notification-dialog/notification-dialog.component';

@Component({
  selector: 'app-vestidos',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent, ConfirmDialogComponent, QrScannerComponent, NotificationDialogComponent],
  templateUrl: './vestidos.component.html',
  styleUrl: './vestidos.component.css'
})
export class VestidosComponent implements OnInit {

  items: Array<{ id: number; codigo: string; talla?: string; color?: string; descripcion: string; valor?: number; ocasion?: string, genero?: string }> = [];
  filtered: Array<{ id: number; codigo: string; talla?: string; color?: string; descripcion: string; valor?: number; ocasion?: string, genero?: string }> = [];
  loading = false;
  error: string | null = null;
  query = '';
  showScanner = false;

  // Modal crear/editar inventario
  modalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  form: FormGroup;
  submitting = false;
  selectedId: number | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  
  // Confirmación genérica
  confirmOpen = false;
  confirmTitle = 'Eliminar vestido';
  confirmMessage = '¿Deseas eliminar este vestido? Esta acción no se puede deshacer.';
  confirmText = 'Eliminar';
  cancelText = 'Cancelar';
  pendingDeleteId: number | null = null;

  // Notification dialog
  notificationOpen = false;
  notificationType: 'success' | 'error' | 'info' | 'warning' = 'info';
  notificationTitle = '';
  notificationMessage = '';

  codigos: string[] = ['VQ', 'VN', 'CK', 'VH', 'PJ', 'VELO', 'CORB', 'CHAL', 'OTRO'];

  @ViewChild('imageInput')
  imageInput!: ElementRef<HTMLInputElement>;

  constructor(private inventarioService: InventarioService, private fb: FormBuilder, private router: Router, private qrService: QrService) {
    this.form = this.fb.group({
      codigoPrefijo: ['', Validators.required],
      codigoNumero: ['', Validators.required],
      descripcion: ['', Validators.required],
      valor: ['', Validators.required],
      ocasion: [''],
      genero: [''],
      color: [''],
      talla: ['']
    });
  }

  ngOnInit(): void {
    this.loadInventario();
  }

  loadInventario(): void {
    this.loading = true;
    this.error = null;
    this.inventarioService.listarInventario().subscribe({
      next: (rows) => {
        this.items = (rows || []).map((r: any) => ({
          id: r.id,
          codigo: r.codigo,
          talla: r.talla,
          color: r.color,
          descripcion: r.descripcion,
          valor: r.valor,
          ocasion: r.ocasion,
          genero: r.genero,
        }));
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'No se pudo cargar el inventario';
        this.loading = false;
        console.error(err);
      }
    });
  }

  applyFilter(): void {
    const q = this.query.trim().toLowerCase();
    if (!q) {
      this.filtered = [...this.items];
      return;
    }
    this.filtered = this.items.filter(it =>
      (it.codigo || '').toLowerCase().includes(q) ||
      (it.talla || '').toLowerCase().includes(q) ||
      (it.color || '').toLowerCase().includes(q) ||
      (it.descripcion || '').toLowerCase().includes(q)
    );
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  clearImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    // Limpiar el input file
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getImageUrl(id: number): string {
    return this.inventarioService.obtenerImagen(id);
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  openFileSelector(): void {
    this.imageInput.nativeElement.click();
  }


  trackRow(_index: number, row: { id: number }): number { return row.id; }

  // Modal handlers
  openModal(): void {
    this.modalMode = 'create';
    this.selectedId = null;
    this.form.reset({ codigoPrefijo: '', codigoNumero: '', descripcion: '', valor: '', ocasion: '', genero: '', color: '', talla: '' });
    this.clearImage();
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  submitForm(): void {
    if (this.form.invalid || this.submitting) return;
    this.submitting = true;
    
    // Crear FormData para incluir archivo si existe
    const formData = new FormData();
    
    // Concatenar código prefijo + número
    const codigoCompleto = this.form.value.codigoPrefijo + this.form.value.codigoNumero;
    
    // Agregar campos del formulario
    Object.keys(this.form.value).forEach(key => {
      if (key === 'codigoPrefijo' || key === 'codigoNumero') {
        return; // Skip these, we'll add the concatenated codigo
      }
      const value = this.form.value[key];
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });
    
    // Agregar código concatenado
    formData.append('codigo', codigoCompleto);

    // Agregar imagen si fue seleccionada
    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    }

    const observer = {
      next: () => {
        this.submitting = false;
        this.closeModal();
        this.loadInventario();
        
        // Mostrar notificación de éxito
        this.showNotification(
          'success',
          'Vestido guardado',
          `El vestido ${codigoCompleto} se ${this.modalMode === 'create' ? 'creó' : 'actualizó'} exitosamente.`
        );
      },
      error: (err: any) => {
        console.error(this.modalMode === 'create' ? 'Error creando inventario' : 'Error actualizando inventario', err);
        this.submitting = false;
        
        // Mostrar notificación de error
        const errorMessage = err.error?.message || err.message || 'No se pudo guardar el vestido';
        this.showNotification(
          'error',
          'Error al guardar',
          errorMessage
        );
      }
    };

    if (this.modalMode === 'create') {
      this.inventarioService.crearInventario(formData).subscribe(observer);
    } else if (this.modalMode === 'edit' && this.selectedId != null) {
      this.inventarioService.actualizarInventario(this.selectedId, formData).subscribe(observer);
    }
  }

  openEdit(row: { id: number; codigo: string; talla?: string; color?: string; descripcion: string; valor?: number; ocasion?: string, genero?: string }): void {
    this.modalMode = 'edit';
    this.selectedId = row.id;
    
    // Separar código en prefijo y número
    let codigoPrefijo = '';
    let codigoNumero = '';
    
    if (row.codigo) {
      // Buscar el prefijo que coincida
      const prefijo = this.codigos.find(p => row.codigo.startsWith(p));
      if (prefijo) {
        codigoPrefijo = prefijo;
        codigoNumero = row.codigo.substring(prefijo.length);
      } else {
        // Si no encuentra prefijo, asumir que todo es número
        codigoPrefijo = this.codigos[0]; // Default al primero
        codigoNumero = row.codigo;
      }
    }
    
    this.form.reset({
      codigoPrefijo: codigoPrefijo,
      codigoNumero: codigoNumero,
      descripcion: row.descripcion || '',
      valor: (row as any).valor || '',
      ocasion: row.ocasion || '',
      genero: row.genero || '',
      color: row.color || '',
      talla: row.talla || ''
    });
    // Limpiar imagen seleccionada pero mostrar la existente
    this.selectedFile = null;
    this.imagePreview = null;
    this.modalOpen = true;
  }

  deleteRow(row: { id: number }): void {
    this.pendingDeleteId = row.id;
    this.confirmOpen = true;
  }

  // Handlers de confirmación
  confirmDelete(): void {
    if (this.pendingDeleteId == null) { this.confirmOpen = false; return; }
    const id = this.pendingDeleteId;
    this.inventarioService.eliminarInventario(id).subscribe({
      next: () => {
        this.confirmOpen = false;
        this.pendingDeleteId = null;
        this.loadInventario();
      },
      error: (err) => {
        console.error('Error eliminando inventario', err);
        this.confirmOpen = false;
        this.pendingDeleteId = null;
      }
    });
  }

  closeConfirm(): void {
    this.confirmOpen = false;
    this.pendingDeleteId = null;
  }

  showNotification(type: 'success' | 'error' | 'info' | 'warning', title: string, message: string): void {
    this.notificationType = type;
    this.notificationTitle = title;
    this.notificationMessage = message;
    this.notificationOpen = true;
  }

  closeNotification(): void {
    this.notificationOpen = false;
  }

  openScanner(): void {
    this.showScanner = true;
  }

  onScanned(value: string) {
    console.log('QR escaneado:', value);
    this.showScanner = false;
    
    try {
      // Verificar si es una URL del sistema
      if (value.includes('/vestido/')) {
        // Extraer el ID del vestido de la URL
        const match = value.match(/\/vestido\/(\d+)/);
        if (match && match[1]) {
          const vestidoId = parseInt(match[1], 10);
          console.log('Redirigiendo a vestido ID:', vestidoId);
          this.router.navigate(['/vestido', vestidoId]);
          return;
        }
      }
      
      // Si no es una URL, buscar por código de referencia
      console.log('Buscando vestido por código:', value);
      const vestido = this.items.find(item => 
        item.codigo && item.codigo.toLowerCase() === value.toLowerCase()
      );
      
      if (vestido) {
        console.log('Vestido encontrado:', vestido);
        this.router.navigate(['/vestido', vestido.id]);
      } else {
        // Si no encuentra nada, mostrar mensaje
        alert(`No se encontró un vestido con el código: "${value}"`);
        console.log('No se encontró vestido con código:', value);
      }
      
    } catch (error) {
      console.error('Error procesando QR escaneado:', error);
      alert('Error procesando el código QR escaneado');
    }
  }

  onScannerError(error: string) {
    console.error('Error del scanner:', error);
    this.showScanner = false;
    // Mostrar un mensaje de error al usuario
    alert('Error al acceder a la cámara: ' + error);
  }

  verDetalle(row:  {id: number; codigo: string; talla?: string; color?: string; descripcion: string; valor?: number; ocasion?: string, genero?: string }): void {
    this.router.navigate([`/vestido/${row.id}`]);
    console.log('Navegar a detalle de vestido ID:', row);
  }

  generateQR(row:  {id: number; codigo: string; talla?: string; color?: string; descripcion: string; valor?: number; ocasion?: string, genero?: string }): void {
    const url = `${window.location.origin}/vestido/${row.id}`
    const title = row.codigo;

    this.qrService.generateAndDownload(url, title);

  }
}
