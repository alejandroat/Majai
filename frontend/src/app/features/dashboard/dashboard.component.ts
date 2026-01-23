import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { AlquilerService } from '../../core/services/alquiler/alquiler.service';
import { InventarioService } from '../../core/services/inventario/inventario.service';

declare const Chart: any;

interface VestidoStats {
  id: number;
  codigoReferencia: string;
  descripcion: string;
  color: string;
  totalAlquileres: number;
  ingresoTotal: number;
  imagen?: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [NavbarComponent, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  @ViewChild('ingresoChartCanvas') ingresoChartCanvas!: ElementRef;

  vestidosStats: VestidoStats[] = [];
  topVestidos: VestidoStats[] = [];
  topIngresos: VestidoStats[] = [];
  totalAlquileres = 0;
  totalIngresos = 0;
  totalVestidos = 0;
  loading = true;

  private chart: any;
  private ingresoChart: any;

  constructor(
    private alquilerService: AlquilerService,
    private inventarioService: InventarioService
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  ngAfterViewInit() {
    // Los gráficos se crearán después de cargar los datos
  }

  async cargarDatos() {
    try {
      this.loading = true;
      
      // Obtener todos los alquileres e inventario
      const [alquileres, inventario] = await Promise.all([
        this.alquilerService.listarAlquileres().toPromise(),
        this.inventarioService.listarInventario().toPromise()
      ]);

      // Procesar estadísticas por vestido
      const statsMap = new Map<number, VestidoStats>();

      // Primero, agregar todos los vestidos del inventario
      inventario?.forEach((vestido: any) => {
        statsMap.set(vestido.id, {
          id: vestido.id,
          codigoReferencia: vestido.codigo || 'N/A',
          descripcion: vestido.descripcion || 'Sin descripción',
          color: vestido.color || 'N/A',
          totalAlquileres: 0,
          ingresoTotal: 0,
          imagen: vestido.imagen ? this.inventarioService.obtenerImagen(vestido.id) : undefined
        });
      });

      // Luego, actualizar con datos de alquileres
      alquileres?.forEach((alquiler: any) => {
        const idVestido = alquiler.idInventario;
        const stats = statsMap.get(idVestido);
        if (stats) {
          stats.totalAlquileres++;
          stats.ingresoTotal += Number(alquiler.valor) || 0;
        }
      });

      this.vestidosStats = Array.from(statsMap.values());
      
      // Calcular totales
      this.totalAlquileres = alquileres?.length || 0;
      this.totalIngresos = this.vestidosStats.reduce((sum, v) => sum + v.ingresoTotal, 0);
      this.totalVestidos = inventario?.length || 0; // Total de vestidos registrados

      // Top 5 por alquileres (solo vestidos que tienen alquileres)
      this.topVestidos = [...this.vestidosStats]
        .filter(v => v.totalAlquileres > 0)
        .sort((a, b) => b.totalAlquileres - a.totalAlquileres)
        .slice(0, 5);

      // Top 5 por ingresos (solo vestidos que tienen ingresos)
      this.topIngresos = [...this.vestidosStats]
        .filter(v => v.ingresoTotal > 0)
        .sort((a, b) => b.ingresoTotal - a.ingresoTotal)
        .slice(0, 5);

      this.loading = false;

      // Crear gráficos después de cargar datos
      setTimeout(() => this.crearGraficos(), 100);
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.loading = false;
    }
  }

  crearGraficos() {
    if (this.chartCanvas && this.topVestidos.length > 0) {
      const ctx = this.chartCanvas.nativeElement.getContext('2d');
      
      if (this.chart) {
        this.chart.destroy();
      }

      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.topVestidos.map(v => `${v.codigoReferencia}`),
          datasets: [{
            label: 'Número de Alquileres',
            data: this.topVestidos.map(v => v.totalAlquileres),
            backgroundColor: [
              'rgba(212, 182, 188, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)'
            ],
            borderColor: [
              'rgba(212, 182, 188, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            title: {
              display: true,
              text: 'Top 5 Vestidos Más Alquilados',
              font: {
                size: 16
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    }

    if (this.ingresoChartCanvas && this.topIngresos.length > 0) {
      const ctx2 = this.ingresoChartCanvas.nativeElement.getContext('2d');
      
      if (this.ingresoChart) {
        this.ingresoChart.destroy();
      }

      this.ingresoChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: this.topIngresos.map(v => `${v.codigoReferencia}`),
          datasets: [{
            label: 'Ingresos (COP)',
            data: this.topIngresos.map(v => v.ingresoTotal),
            backgroundColor: [
              'rgba(212, 182, 188, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)'
            ],
            borderColor: '#fff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'right'
            },
            title: {
              display: true,
              text: 'Top 5 Vestidos por Ingresos',
              font: {
                size: 16
              }
            }
          }
        }
      });
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  }
}
