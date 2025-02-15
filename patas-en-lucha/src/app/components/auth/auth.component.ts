import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AuthComponent {
  authForm: FormGroup;
  isLogin = true;
  loading = false;
  error: string | null = null;
  message: string | null = null;
  private returnUrl: string = '/';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.authForm = this.createForm();
    
    // Obtener mensaje y returnUrl de redirección si existen
    this.route.queryParams.subscribe(params => {
      this.message = params['message'] || null;
      this.returnUrl = params['returnUrl'] || '/';
    });
  }

  createForm(): FormGroup {
    const baseForm = {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    };

    if (!this.isLogin) {
      return this.fb.group({
        ...baseForm,
        name: ['', Validators.required]
      });
    }

    return this.fb.group(baseForm);
  }

  toggleMode(): void {
    this.isLogin = !this.isLogin;
    this.error = null;
    this.authForm = this.createForm();
  }

  onSubmit(): void {
    if (this.authForm.valid) {
      this.loading = true;
      this.error = null;

      const { email, password, name } = this.authForm.value;

      if (this.isLogin) {
        this.authService.login(email, password).subscribe({
          next: () => {
            this.router.navigateByUrl(this.returnUrl);
          },
          error: (error: Error) => {
            this.error = 'Error al iniciar sesión. Por favor, verifica tus credenciales.';
            this.loading = false;
            console.error('Auth error:', error);
          }
        });
      } else {
        this.authService.register(name, email, password).subscribe({
          next: () => {
            // Después del registro exitoso, iniciamos sesión automáticamente
            this.authService.login(email, password).subscribe({
              next: () => {
                this.router.navigateByUrl(this.returnUrl);
              },
              error: (error: Error) => {
                this.error = 'Error al iniciar sesión después del registro.';
                this.loading = false;
                console.error('Login after register error:', error);
              }
            });
          },
          error: (error: Error) => {
            this.error = 'Error al crear la cuenta. Por favor, intenta de nuevo.';
            this.loading = false;
            console.error('Register error:', error);
          }
        });
      }
    }
  }
}
