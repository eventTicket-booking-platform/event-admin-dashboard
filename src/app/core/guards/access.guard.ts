import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminDataService } from '../services/admin-data.service';

export const accessGuard: CanActivateFn = () => {
  const router = inject(Router);
  const data = inject(AdminDataService);
  const hasAccess = data.hasToken();

  return hasAccess ? true : router.createUrlTree(['/login']);
};
