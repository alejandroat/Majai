import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { InventarioService } from '../../core/services/inventario/inventario.service';
import { AlquilerService } from '../../core/services/alquiler/alquiler.service';
import { NotificationDialogComponent } from '../../shared/notification-dialog/notification-dialog.component';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-info-vestido',
  imports: [CommonModule, NavbarComponent, ReactiveFormsModule, NotificationDialogComponent],
  templateUrl: './info-vestido.component.html',
  styleUrls: ['./info-vestido.component.css']
})
export class InfoVestidoComponent implements OnInit {

  vestido: any = {};
  alquileres: any[] = [];
  loading = true;
  
  // Calendar properties
  calendarYear: number = new Date().getFullYear();
  calendarMonth: number = new Date().getMonth();
  calendarWeeks: Array<Array<{ date: Date | null; inMonth: boolean; isToday: boolean; occupied: boolean }>> = [];
  occupiedRanges: Array<{ start: string; end: string }> = [];

  // Rental modal properties
  rentOpen = false;
  rentForm: FormGroup;
  rentSubmitting = false;
  selectedDate: Date | null = null;
  rentalCalendarYear: number = new Date().getFullYear();
  rentalCalendarMonth: number = new Date().getMonth();
  rentalCalendarWeeks: Array<Array<{ date: Date | null; inMonth: boolean; isToday: boolean; disabled: boolean; occupied: boolean; selected: boolean; inRange: boolean }>> = [];

  // Notification dialog
  notificationOpen = false;
  notificationType: 'success' | 'error' | 'info' | 'warning' = 'info';
  notificationTitle = '';
  notificationMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventarioService: InventarioService,
    private alquilerService: AlquilerService,
    private fb: FormBuilder
  ) {
    this.rentForm = this.fb.group({
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      idInventario: ['', Validators.required],
      nombreCliente: ['', Validators.required],
      tipoDocumento: ['CC', Validators.required],
      identificacionCliente: [''],
      telefonoCliente: [''],
      telefonoCliente2: [''], // Segundo teléfono opcional
      direccionCliente: [''],
      deposito: [0],
      valor: [0],
      tipoPago: ['CONTADO'],
      montoPagado: [0],
      observaciones: ['']
    });
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadVestidoDetails(id);
      this.loadVestidoAlquileres(id);
    }
  }

  loadVestidoDetails(id: number) {
    this.inventarioService.inventarioId(id).subscribe({
      next: (data: any) => {
        console.log('Detalles del vestido:', data);
        this.vestido = data;
      },
      error: (err) => {
        console.error('Error al cargar los detalles del vestido', err);
      }
    });
  }

  loadVestidoAlquileres(id: number) {
    this.alquilerService.verAlquilerPorVestido(id).subscribe({
      next: (data: any) => {
        console.log('Alquileres del vestido:', data);
        this.alquileres = data.arrendamientos || [];
        console.log('Arreglo de alquileres:', this.alquileres);
        
        // Construir rangos ocupados para el calendario
        this.occupiedRanges = this.alquileres.map((alquiler: any) => ({
          start: this.parseDateSafely(alquiler.fechaInicio),
          end: this.parseDateSafely(alquiler.fechaFin)
        }));
        
        console.log('Rangos ocupados generados:', this.occupiedRanges);
        
        // Construir calendario
        this.buildCalendar(this.calendarYear, this.calendarMonth);
        this.loading = false; 
      },
      error: (err) => {
        console.error('Error al cargar los alquileres del vestido', err);
        this.alquileres = [];
        this.buildCalendar(this.calendarYear, this.calendarMonth);
        this.loading = false;
      }
    })
  }

  volver() {
    this.router.navigate(['/vestidos']);
  }

  getImageUrl(id: number): string {
    return this.inventarioService.obtenerImagen(id);
  }

  getImageSrc(): string {
    if (this.vestido?.id && this.vestido?.imagenURL) {
      return this.getImageUrl(this.vestido.id);
    }
    return 'https://via.placeholder.com/400x500?text=Sin+Imagen';
  }

  // Calendar methods
  buildCalendar(year: number, month: number): void {
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonthDays = new Date(year, month, 0).getDate();
    const weeks: Array<Array<{ date: Date | null; inMonth: boolean; isToday: boolean; occupied: boolean }>> = [];
    let dayCounter = 1;
    let finished = false;
    const today = new Date();

    for (let w = 0; w < 6 && !finished; w++) {
      const week: Array<{ date: Date | null; inMonth: boolean; isToday: boolean; occupied: boolean }> = [];
      for (let d = 0; d < 7; d++) {
        const cellIndex = w * 7 + d;
        let cellDate: Date | null = null;
        let inMonth = false;

        if (cellIndex < startWeekday) {
          const day = prevMonthDays - (startWeekday - 1 - cellIndex);
          cellDate = new Date(year, month - 1, day);
        } else if (dayCounter <= daysInMonth) {
          cellDate = new Date(year, month, dayCounter);
          inMonth = true;
          dayCounter++;
        } else {
          const day = cellIndex - (startWeekday + daysInMonth) + 1;
          cellDate = new Date(year, month + 1, day);
        }

        const isToday = inMonth && today.getFullYear() === cellDate!.getFullYear() && 
                       today.getMonth() === cellDate!.getMonth() && 
                       today.getDate() === cellDate!.getDate();
        
        let occupied = false;
        if (cellDate) {
          const cellIso = this.toISODate(cellDate);
          occupied = this.isOccupied(cellIso);
        }
        
        week.push({ date: cellDate, inMonth, isToday, occupied });
      }
      weeks.push(week);
      if (dayCounter > daysInMonth) finished = true;
    }
    this.calendarWeeks = weeks;
  }

  prevMonth(): void {
    if (this.calendarMonth === 0) {
      this.calendarMonth = 11;
      this.calendarYear -= 1;
    } else {
      this.calendarMonth -= 1;
    }
    this.buildCalendar(this.calendarYear, this.calendarMonth);
  }

  nextMonth(): void {
    if (this.calendarMonth === 11) {
      this.calendarMonth = 0;
      this.calendarYear += 1;
    } else {
      this.calendarMonth += 1;
    }
    this.buildCalendar(this.calendarYear, this.calendarMonth);
  }

  getMonthName(month: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month];
  }

  private toISODate(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Función para parsear fechas de manera segura evitando problemas de zona horaria
  private parseDateSafely(dateString: string): string {
    // Si ya es una fecha en formato ISO (YYYY-MM-DD), devolverla tal como está
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    // Si es una fecha con timestamp UTC (como del backend), extraer solo la parte de fecha
    if (typeof dateString === 'string' && dateString.includes('T')) {
      // Extraer solo la parte de la fecha antes de la 'T'
      const datePart = dateString.split('T')[0];
      console.log(`Fecha parseada: ${dateString} -> ${datePart}`);
      return datePart;
    }
    
    // Si es una fecha completa, crear un objeto Date y extraer solo la fecha
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Fecha inválida:', dateString);
      return '';
    }
    
    // Para evitar problemas de zona horaria, usar directamente los componentes de la fecha
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private isOccupied(iso: string): boolean {
    for (const r of this.occupiedRanges) {
      if (iso >= r.start && iso <= r.end) {
        console.log(`Fecha ${iso} está ocupada (rango: ${r.start} - ${r.end})`);
        return true;
      }
    }
    return false;
  }

  // Rental modal methods
  openRental(): void {
    if (!this.vestido?.id) return;
    
    this.selectedDate = null;
    this.rentForm.reset({
      fechaInicio: '',
      fechaFin: '',
      idInventario: this.vestido.id,
      nombreCliente: '',
      tipoDocumento: 'CC',
      identificacionCliente: '',
      telefonoCliente: '',
      direccionCliente: '',
      deposito: 0,
      valor: '', // No pre-llenar con el valor del vestido
      tipoPago: 'CONTADO',
      montoPagado: 0
    });
    
    const today = new Date();
    this.rentalCalendarYear = today.getFullYear();
    this.rentalCalendarMonth = today.getMonth();
    
    this.buildRentalCalendar(this.rentalCalendarYear, this.rentalCalendarMonth);
    this.rentOpen = true;
  }

  closeRental(): void {
    this.rentOpen = false;
    this.rentSubmitting = false;
    this.selectedDate = null;
  }

  buildRentalCalendar(year: number, month: number): void {
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonthDays = new Date(year, month, 0).getDate();
    const weeks: Array<Array<{ date: Date | null; inMonth: boolean; isToday: boolean; disabled: boolean; occupied: boolean; selected: boolean; inRange: boolean }>> = [];
    let dayCounter = 1;
    let finished = false;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Obtener fechas seleccionadas del formulario
    const selectedStart = this.rentForm.get('fechaInicio')?.value;
    const selectedEnd = this.rentForm.get('fechaFin')?.value;

    for (let w = 0; w < 6 && !finished; w++) {
      const week: Array<{ date: Date | null; inMonth: boolean; isToday: boolean; disabled: boolean; occupied: boolean; selected: boolean; inRange: boolean }> = [];
      for (let d = 0; d < 7; d++) {
        const cellIndex = w * 7 + d;
        let cellDate: Date | null = null;
        let inMonth = false;

        if (cellIndex < startWeekday) {
          const day = prevMonthDays - (startWeekday - 1 - cellIndex);
          cellDate = new Date(year, month - 1, day);
        } else if (dayCounter <= daysInMonth) {
          cellDate = new Date(year, month, dayCounter);
          inMonth = true;
          dayCounter++;
        } else {
          const day = cellIndex - (startWeekday + daysInMonth) + 1;
          cellDate = new Date(year, month + 1, day);
        }

        const isToday = inMonth && today.getFullYear() === cellDate!.getFullYear() && 
                       today.getMonth() === cellDate!.getMonth() && 
                       today.getDate() === cellDate!.getDate();
        
        let disabled = false;
        let occupied = false;
        let selected = false;
        let inRange = false;
        
        if (cellDate) {
          const cellStart = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
          disabled = cellStart < todayStart;
          const cellIso = this.toISODate(cellDate);
          occupied = this.isOccupied(cellIso);
          
          // Verificar si la fecha está seleccionada
          selected = cellIso === selectedStart || cellIso === selectedEnd;
          
          // Verificar si la fecha está en el rango seleccionado
          if (selectedStart && selectedEnd && cellIso >= selectedStart && cellIso <= selectedEnd) {
            inRange = true;
          }
        }
        
        week.push({ date: cellDate, inMonth, isToday, disabled, occupied, selected, inRange });
      }
      weeks.push(week);
      if (dayCounter > daysInMonth) finished = true;
    }
    this.rentalCalendarWeeks = weeks;
  }

  prevRentalMonth(): void {
    if (this.rentalCalendarMonth === 0) {
      this.rentalCalendarMonth = 11;
      this.rentalCalendarYear -= 1;
    } else {
      this.rentalCalendarMonth -= 1;
    }
    this.buildRentalCalendar(this.rentalCalendarYear, this.rentalCalendarMonth);
  }

  nextRentalMonth(): void {
    if (this.rentalCalendarMonth === 11) {
      this.rentalCalendarMonth = 0;
      this.rentalCalendarYear += 1;
    } else {
      this.rentalCalendarMonth += 1;
    }
    this.buildRentalCalendar(this.rentalCalendarYear, this.rentalCalendarMonth);
  }

  getRentalMonthName(month: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month];
  }

  selectRentalDate(cell: { date: Date | null; inMonth: boolean; disabled: boolean; occupied: boolean }): void {
    if (!cell.inMonth || !cell.date || cell.disabled) return;
    const iso = this.toISODate(cell.date);
    if (this.isOccupied(iso)) return;
    
    const currentStart = this.rentForm.get('fechaInicio')?.value;
    const currentEnd = this.rentForm.get('fechaFin')?.value;
    
    if (!currentStart) {
      // No hay fecha de inicio, establecer fecha de inicio
      this.rentForm.get('fechaInicio')?.setValue(iso);
      this.rentForm.get('fechaFin')?.setValue('');
    } else if (!currentEnd) {
      // Hay fecha de inicio pero no de fin, establecer fecha de fin
      if (iso >= currentStart) {
        // Verificar que no haya fechas ocupadas en el rango
        if (!this.hasOccupiedDatesInRange(currentStart, iso)) {
          this.rentForm.get('fechaFin')?.setValue(iso);
        } else {
          // Si hay fechas ocupadas en el rango, reiniciar con nueva fecha de inicio
          this.rentForm.get('fechaInicio')?.setValue(iso);
          this.rentForm.get('fechaFin')?.setValue('');
        }
      } else {
        // Si la fecha seleccionada es anterior a la fecha de inicio, intercambiar
        this.rentForm.get('fechaInicio')?.setValue(iso);
        this.rentForm.get('fechaFin')?.setValue(currentStart);
      }
    } else {
      // Ambas fechas están seleccionadas, reiniciar con nueva fecha de inicio
      this.rentForm.get('fechaInicio')?.setValue(iso);
      this.rentForm.get('fechaFin')?.setValue('');
    }
    
    // Reconstruir calendario para mostrar la selección actualizada
    this.buildRentalCalendar(this.rentalCalendarYear, this.rentalCalendarMonth);
  }
  
  private hasOccupiedDatesInRange(startDate: string, endDate: string): boolean {
    // Crear fechas directamente desde los componentes para evitar zona horaria
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    
    const current = new Date(start);
    while (current <= end) {
      const iso = this.toISODate(current);
      if (this.isOccupied(iso)) {
        console.log(`Fecha ocupada encontrada en rango: ${iso}`);
        return true;
      }
      current.setDate(current.getDate() + 1);
    }
    return false;
  }

  submitRental(pdf: boolean): void {
    if (this.rentForm.invalid || this.rentSubmitting) return;
    this.rentSubmitting = true;
    
    const formValue = this.rentForm.value;
    
    // Construir array de teléfonos, incluyendo solo los que tengan valor
    const telefonos = [formValue.telefonoCliente];
    if (formValue.telefonoCliente2 && formValue.telefonoCliente2.trim()) {
      telefonos.push(formValue.telefonoCliente2);
    }
    
    const payload = {
      fechaInicio: formValue.fechaInicio,
      fechaFin: formValue.fechaFin,
      idInventario: formValue.idInventario,
      NombreCliente: formValue.nombreCliente,
      tipoDocumento: formValue.tipoDocumento || 'CC',
      identificacionCliente: formValue.identificacionCliente || '',
      telefonoCliente: telefonos,
      direccionCliente: formValue.direccionCliente || '',
      deposito: formValue.deposito || 0,
      valor: formValue.valor || 0,
      tipoPago: formValue.tipoPago || 'CONTADO',
      montoPagado: formValue.montoPagado || 0,
      observaciones: formValue.observaciones || ''
    };
    
    if (pdf) {
      this.alquilerService.crearAlquiler(payload).subscribe({
        next: (response: any) => {
          console.log('Respuesta del servidor:', response);
          this.rentSubmitting = false;
          this.closeRental();
          // Recargar los alquileres y el calendario
          if (this.vestido?.id) {
            this.loadVestidoAlquileres(this.vestido.id);
          }
          
          // Descargar PDF del contrato si está disponible
          if (response && response.pdf && response.pdfFilename) {
            console.log('PDF encontrado, iniciando descarga...');
            this.downloadPDF(response.pdf, response.pdfFilename);
          } else {
            console.log('No se encontró PDF en la respuesta');
          }
          
          // Mostrar notificación de éxito
          this.showNotification(
            'success',
            'Alquiler registrado',
            `El alquiler para ${formValue.nombreCliente} se registró exitosamente.`
          );
        },
        error: (err) => {
          console.error('Error creando alquiler', err);
          this.rentSubmitting = false;
          
          // Mostrar notificación de error
          const errorMessage = err.error?.message || err.message || 'No se pudo registrar el alquiler';
          this.showNotification(
            'error',
            'Error al registrar alquiler',
            errorMessage
          );
        }
      });
    } else {
      this.alquilerService.crearAlquilerSinPDF(payload).subscribe({
        next: (response: any) => {
          console.log('Respuesta del servidor (sin PDF):', response);
          this.rentSubmitting = false;
          this.closeRental();
          
          // Recargar los alquileres y el calendario
          if (this.vestido?.id) {
            this.loadVestidoAlquileres(this.vestido.id);
          }
          
          // Mostrar notificación de éxito
          this.showNotification(
            'success',
            'Alquiler registrado',
            `El alquiler para ${formValue.nombreCliente} se registró exitosamente (sin PDF).`
          );
        },
        error: (err) => {
          console.error('Error creando alquiler (sin PDF)', err);
          this.rentSubmitting = false;
          
          // Mostrar notificación de error
          const errorMessage = err.error?.message || err.message || 'No se pudo registrar el alquiler';
          this.showNotification(
            'error',
            'Error al registrar alquiler',
            errorMessage
          );
        }
      });
    }
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
