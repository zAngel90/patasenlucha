import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Campaign } from '../../models/campaign.model';
import { CampaignService } from '../../services/campaign.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';

@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatChipsModule
  ],
  templateUrl: './campaigns.component.html',
  styleUrls: ['./campaigns.component.scss']
})
export class CampaignsComponent implements OnInit {
  campaigns: Campaign[] = [];
  displayedCampaigns: Campaign[] = [];
  loading = true;
  error: string | null = null;

  // Paginación
  pageSize = 6;
  pageSizeOptions = [6, 12, 24];
  pageIndex = 0;
  totalCampaigns = 0;

  constructor(
    private campaignService: CampaignService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCampaigns();
  }

  loadCampaigns(): void {
    this.loading = true;
    this.error = null;
    
    this.campaignService.getApprovedCampaigns().subscribe({
      next: (campaigns) => {
        this.campaigns = campaigns;
        this.totalCampaigns = campaigns.length;
        this.updateDisplayedCampaigns();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading campaigns:', error);
        this.error = 'Error al cargar las campañas. Por favor, intenta de nuevo.';
        this.loading = false;
      }
    });
  }

  updateDisplayedCampaigns(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedCampaigns = this.campaigns.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedCampaigns();
  }

  getProgressPercentage(campaign: Campaign): number {
    if (!campaign.goal_amount || !campaign.current_amount) return 0;
    return Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100);
  }

  getDaysLeft(campaign: Campaign): number {
    if (!campaign.end_date) return 30;
    const endDate = new Date(campaign.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  navigateToDetails(campaignId: number | undefined): void {
    if (campaignId) {
      this.router.navigate(['/campaigns', campaignId]);
    } else {
      console.error('ID de campaña no disponible');
    }
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/images/default-campaign.jpg';
  }
}
