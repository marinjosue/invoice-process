// invoice-process-front-end/src/app/core/guards/role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const required = route.data?.['permission'] as string | undefined;
    if (!required) return true;

    const permissions = this.authService.getCurrentUser()?.permissions ?? [];
    if (permissions.includes(required)) return true;

    this.router.navigate(['/dashboard']);
    return false;
  }
}
