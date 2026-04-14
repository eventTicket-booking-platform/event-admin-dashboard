import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';
import { AdminDataService } from '../../core/services/admin-data.service';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  imports: [BaseChartDirective, MatButtonModule, MatCardModule, MatIconModule, MatSnackBarModule],
  template: `
    <section class="page-head">
      <div>
        <p class="page-head__eyebrow">Analytics center</p>
        <h2>Reports & Analytics</h2>
        <p class="page-head__copy">Revenue, conversion, satisfaction, and event-level performance.</p>
      </div>
      <div class="page-head__actions">
        <button mat-stroked-button (click)="export('csv')">Export CSV</button>
        <button mat-flat-button color="primary" (click)="export('pdf')">Export PDF</button>
      </div>
    </section>

    <section class="stats-grid">
      @for (metric of metrics(); track metric.label) {
        <mat-card class="stats-card">
          <p>{{ metric.label }}</p>
          <h3>{{ metric.value }}</h3>
          <span>{{ metric.note }}</span>
        </mat-card>
      }
    </section>

    <section class="analytics-grid analytics-grid--reports">
      <mat-card class="panel">
        <div class="panel__header">
          <div>
            <h3>Ticket Sales Trends</h3>
            <p>Last 30 days</p>
          </div>
        </div>
        <canvas baseChart [data]="salesTrendChart" [type]="'line'" [options]="lineOptions"></canvas>
      </mat-card>

      <mat-card class="panel">
        <div class="panel__header">
          <div>
            <h3>Top Events by Revenue</h3>
            <p>Highest grossing experiences</p>
          </div>
        </div>
        <canvas baseChart [data]="revenueChart" [type]="'bar'" [options]="horizontalBarOptions"></canvas>
      </mat-card>

      <mat-card class="panel">
        <div class="panel__header">
          <div>
            <h3>Booking Status Distribution</h3>
            <p>Current lifecycle mix</p>
          </div>
        </div>
        <canvas baseChart [data]="distributionChart" [type]="'pie'" [options]="pieOptions"></canvas>
      </mat-card>
    </section>
  `,
})
export class ReportsComponent {
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject(AdminDataService);

  readonly metrics = computed(() => {
    const bookings = this.data.bookings();
    const totalRevenue = bookings.filter((item) => item.paymentStatus === 'completed').reduce((sum, item) => sum + item.totalAmount, 0);
    const averageBooking = totalRevenue / Math.max(1, bookings.length);

    return [
      { label: 'Total Revenue', value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalRevenue), note: 'Across all completed payments' },
      { label: 'Average Booking Value', value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(averageBooking), note: 'Blended across all orders' },
      { label: 'Conversion Rate', value: '6.8%', note: 'Ticket checkout to completion' },
      { label: 'Customer Satisfaction', value: '92%', note: 'Survey sentiment and support scores' },
    ];
  });

  readonly salesTrendChart = {
    labels: this.data.bookingTrend30().map((point) => point.label),
    datasets: [
      {
        label: 'Sales',
        data: this.data.bookingTrend30().map((point) => point.value),
        tension: 0.35,
        fill: true,
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.16)',
      },
    ],
  };

  readonly revenueChart = {
    labels: this.data.revenuePerformance().map((point) => point.label),
    datasets: [
      {
        label: 'Revenue',
        data: this.data.revenuePerformance().map((point) => point.value),
        borderRadius: 12,
        backgroundColor: '#1E3A5F',
      },
    ],
  };

  readonly distributionChart = {
    labels: this.data.bookingStatusDistribution().map((point) => point.label),
    datasets: [
      {
        data: this.data.bookingStatusDistribution().map((point) => point.value),
        backgroundColor: ['#22C55E', '#F59E0B', '#EF4444'],
      },
    ],
  };

  readonly lineOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
  readonly horizontalBarOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };
  readonly pieOptions = { responsive: true, maintainAspectRatio: false };

  export(kind: 'csv' | 'pdf'): void {
    const message =
      kind === 'csv'
        ? `CSV ready with ${this.data.bookings().length} booking rows.`
        : 'PDF export queued. Connect a backend reporting service to generate the file.';
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
