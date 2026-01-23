import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { AlquilerService } from '../../core/services/alquiler/alquiler.service';
import { AbonoService } from '../../core/services/abono/abono.service';
import { NotificationDialogComponent } from '../../shared/notification-dialog/notification-dialog.component';

@Component({
  selector: 'app-facturacion',
  imports: [NavbarComponent, CommonModule, FormsModule, ReactiveFormsModule, ConfirmDialogComponent, NotificationDialogComponent],
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.css']
})
export class FacturacionComponent implements OnInit {
  
  items: any[] = [];
  filtered: any[] = [];
  loading = false;
  error: string | null = null;
  query = '';

  // Modal de pago
  pagoOpen = false;
  pagoForm: FormGroup;
  pagoSubmitting = false;
  selectedAlquiler: any = null;

  // Modal de detalles de abonos
  detalleOpen = false;
  abonos: any[] = [];
  loadingAbonos = false;
  selectedAlquilerDetalle: any = null;

  // Confirm Dialog
  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmText = 'Eliminar';
  cancelText = 'Cancelar';
  selectedAlquilerToDelete: any = null;

  // Notification dialog
  notificationOpen = false;
  notificationType: 'success' | 'error' | 'info' | 'warning' = 'info';
  notificationTitle = '';
  notificationMessage = '';

  constructor(
    private alquilerService: AlquilerService, 
    private abonoService: AbonoService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.pagoForm = this.fb.group({
      valor: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit() {
    this.loadAlquileres();
  }

  loadAlquileres() {
    this.loading = true;
    this.error = null;
    
    this.alquilerService.listarAlquileres().subscribe({
      next: (data) => {
        console.log('Alquileres cargados:', data);
        this.items = data || [];
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar alquileres:', err);
        this.error = 'No se pudieron cargar los alquileres';
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    const q = this.query.trim().toLowerCase();
    if (!q) {
      this.filtered = [...this.items];
      return;
    }
    this.filtered = this.items.filter(item =>
      (item.NombreCliente || '').toLowerCase().includes(q) ||
      (item.identificacionCliente || '').toLowerCase().includes(q) ||
      (item.Inventario?.codigo || '').toLowerCase().includes(q) ||
      (item.Inventario?.descripcion || '').toLowerCase().includes(q)
    );
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  trackRow(_index: number, row: any): number {
    return row.id;
  }

  trackAbono(_index: number, abono: any): number {
    return abono.id;
  }

  getTotalPagado(row: any): number {
    const montoPagado = row.montoPagado || 0;
    const sumaAbonos = (row.abonos || []).reduce((suma: number, abono: any) => {
      return suma + (abono.valor || 0);
    }, 0);
    return montoPagado + sumaAbonos;
  }

  

  verDetalle(row: any): void {
    console.log('Ver detalle de alquiler:', row);
    this.selectedAlquilerDetalle = row;
    this.loadAbonos(row.id);
    this.detalleOpen = true;
  }

  registrarPago(row: any): void {
    console.log('Registrar pago para:', row);
    this.selectedAlquiler = row;
    this.pagoForm.reset({ valor: '' });
    this.pagoOpen = true;
  }

  closePago(): void {
    this.pagoOpen = false;
    this.pagoSubmitting = false;
    this.selectedAlquiler = null;
  }

  submitPago(): void {
    if (this.pagoForm.invalid || this.pagoSubmitting || !this.selectedAlquiler) return;
    
    this.pagoSubmitting = true;
    const valorPago = this.pagoForm.value.valor;
    const nombreCliente = this.selectedAlquiler.NombreCliente;
    
    const pagoData = {
      idArrendamiento: this.selectedAlquiler.id,
      idUsuario: 1, // Por ahora un valor fijo, debería venir del usuario logueado
      fecha: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
      valor: valorPago
    };
    
    this.abonoService.crearAbono(pagoData).subscribe({
      next: (response: any) => {
        console.log('Respuesta del servidor:', response);
        this.pagoSubmitting = false;
        this.closePago();
        // Recargar la lista para mostrar el pago actualizado
        this.loadAlquileres();
        
        // Descargar PDF del recibo si está disponible
        if (response && response.pdf && response.pdfFilename) {
          console.log('PDF encontrado, iniciando descarga...');
          this.downloadPDF(response.pdf, response.pdfFilename);
        } else {
          console.log('No se encontró PDF en la respuesta');
        }
        
        // Mostrar notificación de éxito
        this.showNotification(
          'success',
          'Pago registrado',
          `Se registró exitosamente el pago de $${valorPago} para ${nombreCliente}.`
        );
      },
      error: (err) => {
        console.error('Error al registrar pago:', err);
        this.pagoSubmitting = false;
        
        // Mostrar notificación de error
        const errorMessage = err.error?.message || err.message || 'No se pudo registrar el pago';
        this.showNotification(
          'error',
          'Error al registrar pago',
          errorMessage
        );
      }
    });
  }

  downloadPDF(base64: string, filename: string): void {
    try {
      console.log('Descargando PDF:', filename);
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      console.log('PDF descargado exitosamente');
    } catch (error) {
      console.error('Error al descargar PDF:', error);
    }
  }

  loadAbonos(idAlquiler: number): void {
    this.loadingAbonos = true;
    this.abonos = [];
    
    console.log('Cargando abonos para alquiler ID:', idAlquiler);
    
    this.abonoService.verAbonosPorAlquiler(idAlquiler).subscribe({
      next: (data) => {
        console.log('Respuesta completa del servicio:', data);
        
        // La respuesta viene como { arrendamiento, abonos, resumen }
        if (data && data.abonos) {
          this.abonos = data.abonos;
          console.log('Abonos extraídos:', this.abonos);
          console.log('Cantidad de abonos:', this.abonos.length);
        } else {
          console.warn('No se encontró la propiedad abonos en la respuesta');
          this.abonos = [];
        }
        
        this.loadingAbonos = false;
      },
      error: (err) => {
        console.error('Error al cargar abonos:', err);
        console.error('Detalles del error:', err.error);
        this.loadingAbonos = false;
      }
    });
  }

  closeDetalle(): void {
    this.detalleOpen = false;
    this.selectedAlquilerDetalle = null;
    this.abonos = [];
    this.loadingAbonos = false;
  }

  eliminarAlquiler(row: any): void {
    this.selectedAlquilerToDelete = row;
    this.confirmTitle = 'Eliminar alquiler';
    this.confirmMessage = `¿Estás seguro de que deseas eliminar el alquiler de ${row.NombreCliente}?`;
    this.confirmOpen = true;
  }

  confirmDelete(): void {
    if (this.selectedAlquilerToDelete) {
      this.alquilerService.eliminarAlquiler(this.selectedAlquilerToDelete.id).subscribe({
        next: () => {
          console.log('Alquiler eliminado exitosamente');
          this.loadAlquileres();
          this.closeConfirm();
        },
        error: (err) => {
          console.error('Error al eliminar alquiler:', err);
          this.closeConfirm();
        }
      });
    }
  }

  closeConfirm(): void {
    this.confirmOpen = false;
    this.selectedAlquilerToDelete = null;
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

}
