import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AdminDataService } from '../../core/services/admin-data.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { CategoryRecord } from '../../models';

@Component({
  selector: 'app-categories',
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  template: `
    <section class="page-actions">
      <button mat-flat-button (click)="load()">Refresh</button>
    </section>

    <section class="content-grid">
      <mat-card class="panel">
        <div class="panel__header">
          <div>
            <h3>Available categories</h3>
          </div>
        </div>
        <div class="data-list">
          @for (category of categories(); track category.categoryId) {
            <div class="data-row">
              <div class="data-row__main">
                <strong>{{ category.name }}</strong>
                <p>{{ category.description || 'No description' }}</p>
                <span>{{ category.active ? 'Active' : 'Inactive' }}</span>
              </div>
              <div class="inline-actions">
                <button mat-button (click)="edit(category)">Edit</button>
                <button mat-button (click)="remove(category.categoryId)">Delete</button>
              </div>
            </div>
          } @empty {
            <p class="muted-copy">No categories available.</p>
          }
        </div>
      </mat-card>

      <mat-card class="panel">
        <div class="panel__header">
          <div>
            <h3>{{ editingCategoryId() ? 'Edit category' : 'Create category' }}</h3>
            <p>Category create and update use the same fields.</p>
          </div>
        </div>
        <form [formGroup]="categoryForm" class="form-stack" (ngSubmit)="save()">
          <mat-form-field appearance="outline">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Description</mat-label>
            <textarea matInput rows="5" formControlName="description"></textarea>
          </mat-form-field>
          <div class="inline-actions">
            <button mat-flat-button type="submit" [disabled]="categoryForm.invalid">Save</button>
            <button mat-stroked-button type="button" (click)="reset()">Clear</button>
          </div>
        </form>
      </mat-card>
    </section>
  `,
})
export class CategoriesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(AdminDataService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = signal<CategoryRecord[]>([]);
  readonly editingCategoryId = signal<number | null>(null);

  readonly categoryForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.data
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(error.error?.message || error.message || 'Unable to load categories.');
        },
      });
  }

  edit(category: CategoryRecord): void {
    this.editingCategoryId.set(category.categoryId);
    this.categoryForm.patchValue({ name: category.name, description: category.description });
  }

  save(): void {
    if (this.categoryForm.invalid) {
      return;
    }

    const request = this.categoryForm.getRawValue();
    const action = this.editingCategoryId()
      ? this.data.updateCategory(this.editingCategoryId()!, request)
      : this.data.createCategory(request);

    action.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.snackbar.success(response.message || 'Category saved.');
        this.reset();
        this.load();
      },
      error: (error: { error?: { message?: string }; message?: string }) => {
        this.snackbar.error(error.error?.message || error.message || 'Unable to save category.');
      },
    });
  }

  remove(categoryId: number): void {
    this.data
      .deleteCategory(categoryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.snackbar.success(response.message || 'Category deleted.');
          this.load();
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.snackbar.error(error.error?.message || error.message || 'Unable to delete category.');
        },
      });
  }

  reset(): void {
    this.editingCategoryId.set(null);
    this.categoryForm.reset({ name: '', description: '' });
  }
}
