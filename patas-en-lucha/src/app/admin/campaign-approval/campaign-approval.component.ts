import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignService } from '../../services/campaign.service';
import { Campaign } from '../../models/campaign.model';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';

@Component({
  selector: 'app-campaign-approval',
  templateUrl: './campaign-approval.component.html',
  styleUrls: ['./campaign-approval.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTableModule
  ]
})
export class CampaignApprovalComponent implements OnInit {
  pendingCampaigns: Campaign[] = [];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  processingCampaignId: number | null = null;
  displayedColumns: string[] = ['id', 'title', 'description', 'goal', 'actions'];
  backendUrl = environment.apiUrl;

  constructor(
    private campaignService: CampaignService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPendingCampaigns();
  }

  loadPendingCampaigns(): void {
    this.error = null;
    this.successMessage = null;
    this.loading = true;

    this.campaignService.getPendingCampaigns().subscribe({
      next: (campaigns: Campaign[]) => {
        this.pendingCampaigns = campaigns;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading pending campaigns:', error);
        this.error = 'Error al cargar las campañas pendientes';
        this.loading = false;
        this.showErrorMessage('Error al cargar las campañas pendientes');
      }
    });
  }

  approveCampaign(id: number): void {
    if (!id || this.processingCampaignId) return;

    this.processingCampaignId = id;
    this.error = null;
    this.successMessage = null;
    this.loading = true;

    this.campaignService.updateCampaignStatus(id, 'approved').subscribe({
      next: () => {
        this.successMessage = 'Campaña aprobada exitosamente';
        this.pendingCampaigns = this.pendingCampaigns.filter(c => c.id !== id);
        this.processingCampaignId = null;
        this.loading = false;
        this.showSuccessMessage('Campaña aprobada exitosamente');
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error approving campaign:', error);
        this.error = 'Error al aprobar la campaña';
        this.processingCampaignId = null;
        this.loading = false;
        this.showErrorMessage('Error al aprobar la campaña');
      }
    });
  }

  rejectCampaign(id: number): void {
    if (!id || this.processingCampaignId) return;

    this.processingCampaignId = id;
    this.error = null;
    this.successMessage = null;
    this.loading = true;

    this.campaignService.updateCampaignStatus(id, 'rejected').subscribe({
      next: () => {
        this.successMessage = 'Campaña rechazada exitosamente';
        this.pendingCampaigns = this.pendingCampaigns.filter(c => c.id !== id);
        this.processingCampaignId = null;
        this.loading = false;
        this.showSuccessMessage('Campaña rechazada exitosamente');
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error rejecting campaign:', error);
        this.error = 'Error al rechazar la campaña';
        this.processingCampaignId = null;
        this.loading = false;
        this.showErrorMessage('Error al rechazar la campaña');
      }
    });
  }

  viewCampaignDetails(id: number): void {
    this.router.navigate(['/campaign', id]);
  }

  calculateProgress(current: number, goal: number): number {
    return (current / goal) * 100;
  }

  isProcessing(id: number): boolean {
    return this.processingCampaignId === id;
  }

  showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/default-campaign.jpg';
  }

  getProgressPercentage(campaign: Campaign): number {
    if (!campaign.goal_amount) return 0;
    return Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100);
  }
}
