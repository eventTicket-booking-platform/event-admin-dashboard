import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const accessGuard: CanActivateFn = () => {
  const router = inject(Router);
  const hasAccess = true;

  return hasAccess ? true : router.createUrlTree(['/dashboard']);
};
