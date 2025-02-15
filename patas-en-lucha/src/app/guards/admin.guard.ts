import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!this.authService.getCurrentUser()) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: this.router.url }
      });
      return false;
    }

    if (this.authService.isAdmin()) {
      return true;
    }

    // Si el usuario está autenticado pero no es admin, redirigir a home
    this.router.navigate(['/'], { 
      queryParams: { error: 'access_denied' }
    });
    return false;
  }
}
