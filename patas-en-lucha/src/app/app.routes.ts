import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CampaignsComponent } from './components/campaigns/campaigns.component';
import { CreateCampaignComponent } from './components/create-campaign/create-campaign.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { CampaignDetailsComponent } from './components/campaign-details/campaign-details.component';
import { AuthComponent } from './components/auth/auth.component';
import { authGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'auth',
    component: AuthComponent
  },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'campaigns',
    loadComponent: () => import('./components/campaigns/campaigns.component').then(m => m.CampaignsComponent)
  },
  {
    path: 'create-campaign',
    loadComponent: () => import('./components/create-campaign/create-campaign.component').then(m => m.CreateCampaignComponent),
    canActivate: [authGuard]
  },
  {
    path: 'campaigns/:id',
    loadComponent: () => import('./components/campaign-details/campaign-details.component').then(m => m.CampaignDetailsComponent)
  },
  {
    path: 'news',
    loadComponent: () => import('./components/news/news.component').then(m => m.NewsComponent)
  },
  {
    path: 'news/:id',
    loadComponent: () => import('./components/news/news-details.component').then(m => m.NewsDetailsComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard, AdminGuard]
  },
  {
    path: 'admin/news',
    loadComponent: () => import('./admin/news-management/news-management.component').then(m => m.NewsManagementComponent),
    canActivate: [authGuard, AdminGuard]
  },
  {
    path: 'admin/approve-campaigns',
    loadComponent: () => import('./admin/campaign-approval/campaign-approval.component').then(m => m.CampaignApprovalComponent),
    canActivate: [authGuard, AdminGuard]
  },
  { path: '**', redirectTo: '' }
];
