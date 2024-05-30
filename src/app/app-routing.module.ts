import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CanActivate } from './guards/auth.guard';
import { FormsModule } from '@angular/forms';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { AddDevicesComponent } from './components/add-devices/add-devices.component';
import { HelpPageComponent } from './components/help-page/help-page.component';
import { ProsumerComponent } from './components/prosumer/prosumer.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [CanActivate] },
  { path: 'add-devices', component: AddDevicesComponent, canActivate: [CanActivate] },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'help-page', component: HelpPageComponent },
  { path: 'prosumer', component: ProsumerComponent, canActivate: [CanActivate] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes), FormsModule],
  exports: [RouterModule, FormsModule]
})
export class AppRoutingModule { }
