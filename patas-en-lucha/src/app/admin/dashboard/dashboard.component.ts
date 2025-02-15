import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CampaignService } from '../../services/campaign.service';
import { NewsService } from '../../services/news.service';
import { Campaign } from '../../models/campaign.model';
import { News } from '../../models/news.model';
import { ThemePalette } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { HttpErrorResponse } from '@angular/common/http';
import { SafePipe } from '../../pipes/safe.pipe';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    SafePipe
  ]
})
export class DashboardComponent implements OnInit {
  campaigns: Campaign[] = [];
  news: News[] = [];
  filteredCampaigns: Campaign[] = [];
  selectedCampaign: Campaign | null = null;
  selectedImagesGallery: Campaign | null = null;
  loading = false;
  searchTerm = '';
  currentFilter: 'all' | 'pending' | 'approved' | 'rejected' = 'all';
  backendUrl = environment.apiUrl;
  selectedMedicalProof: any = null;

  constructor(
    private campaignService: CampaignService,
    private newsService: NewsService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCampaigns();
    this.loadNews();
  }

  loadCampaigns(): void {
    this.loading = true;
    console.log('Iniciando carga de campañas');
    
    this.campaignService.getAllCampaigns().subscribe({
      next: (campaigns) => {
        console.log('Campañas recibidas del servidor:', campaigns);
        this.campaigns = campaigns;
        this.filteredCampaigns = campaigns;
        this.loading = false;
        console.log('Campañas cargadas y asignadas:', this.filteredCampaigns.length);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al cargar campañas:', error);
        this.loading = false;
      }
    });
  }

  loadNews(): void {
    this.newsService.getPublicNews().subscribe({
      next: (news) => {
        this.news = news;
      },
      error: (error) => {
        console.error('Error loading news:', error);
      }
    });
  }

  onFilterChange(event: any): void {
    console.log('Filtro seleccionado:', event.value);
    this.currentFilter = event.value;
    this.filterCampaigns();
  }

  onSearchChange(event: string): void {
    console.log('Término de búsqueda:', event);
    this.searchTerm = event;
    this.filterCampaigns();
  }

  private filterCampaigns(): void {
    console.log('Iniciando filtrado de campañas');
    console.log('Estado actual:', {
      totalCampaigns: this.campaigns.length,
      currentFilter: this.currentFilter,
      searchTerm: this.searchTerm
    });

    this.filteredCampaigns = this.campaigns.filter(campaign => {
      // Primero verificar el filtro de estado
      const passesStatusFilter = this.currentFilter === 'all' || campaign.status === this.currentFilter;
      
      // Luego verificar el término de búsqueda
      let passesSearchFilter = true;
      const searchTerm = this.searchTerm?.trim() || '';
      
      if (searchTerm !== '') {
        const search = searchTerm.toLowerCase();
        const title = campaign.title?.toLowerCase() || '';
        const description = campaign.description?.toLowerCase() || '';
        const creatorName = campaign.creator_name?.toLowerCase() || '';
        
        passesSearchFilter = title.includes(search) || 
                           description.includes(search) || 
                           creatorName.includes(search);
      }

      return passesStatusFilter && passesSearchFilter;
    });

    console.log('Resultado del filtrado:', {
      filteredCount: this.filteredCampaigns.length,
      firstItem: this.filteredCampaigns[0]
    });
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'approved': return 'check_circle';
      case 'pending': return 'pending';
      case 'rejected': return 'cancel';
      default: return 'help';
    }
  }

  getStatusColor(status: string): ThemePalette {
    switch (status) {
      case 'approved': return 'primary';
      case 'pending': return 'accent';
      case 'rejected': return 'warn';
      default: return undefined;
    }
  }

  getApprovedCount(): number {
    return this.campaigns.filter(c => c.status === 'approved').length;
  }

  getPendingCount(): number {
    return this.campaigns.filter(c => c.status === 'pending').length;
  }

  getTotalAmount(): number {
    return this.campaigns.reduce((sum, campaign) => sum + (campaign.current_amount || 0), 0);
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/default-campaign.jpg';
  }

  openCampaignDetails(campaign: Campaign): void {
    this.selectedCampaign = campaign;
  }

  closeModal(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.selectedCampaign = null;
    }
  }

  getProgressPercentage(campaign: Campaign): number {
    if (!campaign.goal_amount) return 0;
    return Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100);
  }

  approveCampaign(id: number | undefined): void {
    if (!id) return;
    
    this.campaignService.updateCampaignStatus(id, 'approved').subscribe({
      next: () => {
        console.log('Campaña aprobada exitosamente');
        this.loadCampaigns();
        if (this.selectedCampaign?.id === id) {
          this.selectedCampaign = null;
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al aprobar la campaña:', error);
        alert('Error al aprobar la campaña. Por favor, inténtalo de nuevo.');
      }
    });
  }

  rejectCampaign(id: number | undefined): void {
    if (!id) return;
    
    this.campaignService.updateCampaignStatus(id, 'rejected').subscribe({
      next: () => {
        console.log('Campaña rechazada exitosamente');
        this.loadCampaigns();
        if (this.selectedCampaign?.id === id) {
          this.selectedCampaign = null;
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al rechazar la campaña:', error);
        alert('Error al rechazar la campaña. Por favor, inténtalo de nuevo.');
      }
    });
  }

  deleteCampaign(id: number | undefined): void {
    if (!id) return;
    
    if (confirm('¿Estás seguro de que deseas eliminar esta campaña? Esta acción no se puede deshacer.')) {
      this.loading = true;
      console.log('Intentando eliminar campaña:', id);
      
      this.campaignService.deleteCampaign(id).subscribe({
        next: () => {
          console.log('Campaña eliminada exitosamente');
          alert('Campaña eliminada exitosamente');
          this.loadCampaigns();
          if (this.selectedCampaign?.id === id) {
            this.selectedCampaign = null;
          }
          if (this.selectedImagesGallery?.id === id) {
            this.selectedImagesGallery = null;
          }
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al eliminar la campaña:', error);
          alert('Error al eliminar la campaña. Por favor, inténtalo de nuevo.');
          this.loading = false;
        }
      });
    }
  }

  openImageGallery(campaign: Campaign): void {
    this.selectedImagesGallery = campaign;
  }

  closeImageGallery(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.selectedImagesGallery = null;
    }
  }

  openMedicalProof(campaign: Campaign): void {
    if (campaign.medical_proof) {
      this.selectedMedicalProof = {
        campaign: campaign,
        proofUrl: campaign.medical_proof,
        proofType: campaign.proof_type,
        proofDescription: campaign.proof_description
      };
    }
  }

  closeMedicalProof(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.selectedMedicalProof = null;
    }
  }

  getProofTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      'factura': 'Factura o ticket de gastos veterinarios',
      'diagnostico': 'Diagnóstico médico veterinario',
      'receta': 'Receta médica veterinaria',
      'informe': 'Informe clínico veterinario'
    };
    return types[type] || type;
  }

  isPdfFile(url: string): boolean {
    return url.toLowerCase().endsWith('.pdf');
  }
}
