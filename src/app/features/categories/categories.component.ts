import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CategoriesApiService } from './categories-api.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { CategoryRecord } from './categories.models';

@Component({
  selector: 'app-categories',
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './categories.component.html',
})
export class CategoriesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly categoriesApi = inject(CategoriesApiService);
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
    this.categoriesApi
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
      ? this.categoriesApi.updateCategory(this.editingCategoryId()!, request)
      : this.categoriesApi.createCategory(request);

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
    this.categoriesApi
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
