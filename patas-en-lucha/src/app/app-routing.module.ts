import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { CampaignFormComponent } from './campaigns/campaign-form/campaign-form.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { DashboardComponent } from './admin/dashboard/dashboard.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'campaigns/new', component: CampaignFormComponent, canActivate: [AuthGuard] },
  { 
    path: 'admin', 
    component: DashboardComponent, 
    canActivate: [AuthGuard, AdminGuard] 
  },
  { path: '', redirectTo: '/campaigns', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
