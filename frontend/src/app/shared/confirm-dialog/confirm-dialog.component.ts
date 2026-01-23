import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent {
  @Input() title = 'Confirmar eliminación';
  @Input() message = 'Para confirmar la eliminación, ingresa tu contraseña:';
  @Input() confirmText = 'Eliminar';
  @Input() cancelText = 'Cancelar';
  @Input() requiredPassword = 'admin123'; // Contraseña por defecto

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  password = '';
  error = '';
  isValidating = false;

  onConfirm() { 
    if (!this.password.trim()) {
      this.error = 'La contraseña es requerida';
      return;
    }

    if (this.password !== this.requiredPassword) {
      this.error = 'Contraseña incorrecta';
      this.password = '';
      return;
    }

    this.error = '';
    this.confirm.emit(); 
  }
  
  onCancel() { 
    this.password = '';
    this.error = '';
    this.cancel.emit(); 
  }

  onPasswordInput() {
    if (this.error) {
      this.error = '';
    }
  }
}
