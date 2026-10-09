import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminDataService } from '../services/admin-data.service';

export const accessGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const data = inject(AdminDataService);
  if (!data.hasToken() || !data.canManage()) return router.createUrlTree(['/login']);
  return route.data['adminOnly'] && !data.isAdmin() ? router.createUrlTree(['/dashboard']) : true;
};
