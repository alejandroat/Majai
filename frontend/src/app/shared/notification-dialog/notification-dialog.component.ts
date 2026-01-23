import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

@Component({
  selector: 'app-notification-dialog',
  imports: [CommonModule],
  templateUrl: './notification-dialog.component.html',
  styleUrl: './notification-dialog.component.css'
})
export class NotificationDialogComponent {
  @Input() type: NotificationType = 'info';
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() confirmText: string = 'Aceptar';
  @Input() autoClose: boolean = false;
  @Input() autoCloseDelay: number = 3000;

  @Output() close = new EventEmitter<void>();

  ngOnInit() {
    if (this.autoClose) {
      setTimeout(() => {
        this.onClose();
      }, this.autoCloseDelay);
    }
  }

  onClose() {
    this.close.emit();
  }

  getIcon(): string {
    switch (this.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  }
}