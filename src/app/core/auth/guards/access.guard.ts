import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

export const accessGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  if (!auth.hasToken() || !auth.canManage()) return router.createUrlTree(['/login']);
  return route.data['adminOnly'] && !auth.isAdmin() ? router.createUrlTree(['/dashboard']) : true;
};
