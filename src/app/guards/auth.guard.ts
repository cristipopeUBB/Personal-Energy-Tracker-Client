import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { NgToastService } from 'ng-angular-popup';

export const CanActivate = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(NgToastService);

  if(authService.isLoggedIn()) {
    return true;
  }
  else {
    toast.error({detail:'ERROR', summary:'Please Log in first!'});
    router.navigate(['login']);
    return false;
  }
};
