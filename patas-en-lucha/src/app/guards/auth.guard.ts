import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Guardar la URL a la que el usuario intentaba acceder
  const returnUrl = router.routerState.snapshot.url;
  
  // Redirigir al usuario a la página de autenticación con un mensaje informativo
  router.navigate(['/auth'], { 
    queryParams: { 
      returnUrl,
      message: 'Debes iniciar sesión para crear una campaña'
    } 
  });
  return false;
};
