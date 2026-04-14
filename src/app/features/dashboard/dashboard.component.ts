import { DatePipe, NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';
import { AdminDataService } from '../../core/services/admin-data.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [BaseChartDirective, DatePipe, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule, NgClass],
  template: `
    <section class="page-head">
      <div>
        <p class="page-head__eyebrow">Operations overview</p>
        <h2>Dashboard</h2>
        <p class="page-head__copy">Live performance, delivery status, and recent operational activity.</p>
      </div>
      <div class="page-head__actions">
        <button mat-stroked-button>Refresh</button>
        <button mat-flat-button color="primary">Generate Snapshot</button>
      </div>
    </section>

    <section class="stats-grid">
      @for (stat of data.dashboardStats(); track stat.label) {
        <mat-card class="stats-card">
          <p>{{ stat.label }}</p>
          <h3>{{ stat.value }}</h3>
          <span class="trend" [ngClass]="stat.direction">{{ stat.direction === 'up' ? '↑' : '↓' }} {{ stat.trend }}</span>
        </mat-card>
      }
    </section>

    <section class="analytics-grid">
      <mat-card class="panel panel--wide">
        <div class="panel__header">
          <div>
            <h3>Booking Trends</h3>
            <p>Monitor demand across the selected time range.</p>
          </div>
          <mat-chip-set>
            <mat-chip-option [selected]="range() === 7" (click)="range.set(7)">7 Days</mat-chip-option>
            <mat-chip-option [selected]="range() === 30" (click)="range.set(30)">30 Days</mat-chip-option>
          </mat-chip-set>
        </div>
        <canvas baseChart [data]="bookingChartData()" [options]="lineOptions" [type]="'line'"></canvas>
      </mat-card>

      <mat-card class="panel">
        <div class="panel__header">
          <div>
            <h3>Notifications Status</h3>
            <p>Email and outbound delivery health.</p>
          </div>
          <button mat-button color="primary">Retry Failed</button>
        </div>
        <div class="status-list">
          @for (item of data.notifications().slice(0, 6); track item.id) {
            <div class="status-item">
              <div>
                <strong>{{ item.recipient }}</strong>
                <p>{{ item.sentAt | date: 'medium' }}</p>
              </div>
              <span class="status-badge status-badge--{{ item.status }}">{{ item.status }}</span>
            </div>
          }
        </div>
      </mat-card>

      <mat-card class="panel">
        <div class="panel__header">
          <div>
            <h3>Event Performance</h3>
            <p>Top events ranked by tickets sold.</p>
          </div>
        </div>
        <canvas baseChart [data]="eventChartData" [options]="barOptions" [type]="'bar'"></canvas>
      </mat-card>

      <mat-card class="panel">
        <div class="panel__header">
          <div>
            <h3>Recent Activity</h3>
            <p>Latest high-signal operational changes.</p>
          </div>
        </div>
        <div class="activity-list">
          @for (item of data.activities().slice(0, 6); track item.id) {
            <div class="activity-item">
              <div class="activity-item__dot"></div>
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.detail }}</p>
                <span>{{ item.timestamp | date: 'medium' }}</span>
              </div>
            </div>
          }
        </div>
      </mat-card>
    </section>
  `,
})
export class DashboardComponent {
  readonly data = inject(AdminDataService);
  readonly range = signal<7 | 30>(7);

  readonly bookingChartData = computed(() => {
    const points = this.range() === 7 ? this.data.bookingTrend7() : this.data.bookingTrend30();
    return {
      labels: points.map((point) => point.label),
      datasets: [
        {
          label: 'Bookings',
          data: points.map((point) => point.value),
          tension: 0.35,
          borderColor: '#1E3A5F',
          backgroundColor: 'rgba(30, 58, 95, 0.18)',
          fill: true,
        },
      ],
    };
  });

  readonly eventChartData = {
    labels: this.data.eventPerformance().map((point) => point.label),
    datasets: [
      {
        label: 'Tickets Sold',
        data: this.data.eventPerformance().map((point) => point.value),
        borderRadius: 10,
        backgroundColor: ['#1E3A5F', '#325b8f', '#4a73a6', '#6a8cb7', '#8ca8ca', '#acc4dd'],
      },
    ],
  };

  readonly lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
  };

  readonly barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
  };
}
