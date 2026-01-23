import { Component, EventEmitter, Output, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-scanner.component.html',
  styleUrl: './qr-scanner.component.css'
})
export class QrScannerComponent implements OnDestroy, AfterViewInit {

  @ViewChild('video', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  @Output() scanned = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();
  @Output() error = new EventEmitter<string>();

  private codeReader = new BrowserQRCodeReader();
  private controls?: IScannerControls;
  isLoading = true;
  errorMessage = '';

  ngAfterViewInit() {
    this.startScan();
  }

  async startScan() {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      
      // Solicitar permisos de cámara
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Listar dispositivos de video disponibles
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      
      if (devices.length === 0) {
        throw new Error('No se encontraron cámaras disponibles');
      }

      // Usar la primera cámara disponible (trasera preferentemente)
      let selectedDevice = devices[0];
      
      // Intentar encontrar cámara trasera
      const rearCamera = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      );
      
      if (rearCamera) {
        selectedDevice = rearCamera;
      }

      this.controls = await this.codeReader.decodeFromVideoDevice(
        selectedDevice.deviceId,
        this.videoElement.nativeElement,
        (result, error) => {
          if (result) {
            const scannedText = result.getText();
            console.log('QR detectado:', scannedText);
            this.scanned.emit(scannedText);
            this.stop();
          }
          if (error && error.name !== 'NotFoundException') {
            console.warn('Error escaneando QR:', error);
          }
        }
      );
      
      this.isLoading = false;
      
    } catch (err: any) {
      this.isLoading = false;
      this.errorMessage = err.message || 'Error al acceder a la cámara';
      this.error.emit(this.errorMessage);
      console.error('Error iniciando scanner QR:', err);
    }
  }

  stop() {
    this.controls?.stop();
    this.controls = undefined;
    this.closed.emit();
  }

  ngOnDestroy() {
    this.stop();
  }

}
