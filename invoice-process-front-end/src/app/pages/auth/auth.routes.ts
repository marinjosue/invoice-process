import { Routes } from '@angular/router';
import { LoginPage } from '@/pages/auth/login-page';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ChangePasswordPage } from '@/pages/auth/ChangePasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

import { AuthGuard } from '@/core/guards/auth.guard';

export const authRoutes: Routes = [
  {
    path: '',
    children: [
      { 
        path: 'login', 
        component: LoginPage,
        data: { title: 'Inicio de Sesión' } 
      },
      { 
        path: 'register', 
        component: RegisterPage,
        data: { title: 'Crear Cuenta' } 
      },
      { 
        path: 'forgot-password', 
        component: ForgotPasswordPage,
        data: { title: 'Recuperar Contraseña' } 
      },
      { 
        path: 'reset-password/:token', 
        component: ResetPasswordPage,
        data: { title: 'Restablecer Contraseña' } 
      },
      { 
        path: 'change-password', 
        component: ChangePasswordPage,
        canActivate: [AuthGuard],
        data: { title: 'Cambiar Contraseña' } 
      },
      { 
        path: '', 
        redirectTo: 'login', 
        pathMatch: 'full' 
      }
    ]
  }
];
