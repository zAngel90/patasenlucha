import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Campaign } from '../../models/campaign.model';
import { CampaignService } from '../../services/campaign.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-campaign-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './campaign-details.component.html',
  styleUrls: ['./campaign-details.component.scss']
})
export class CampaignDetailsComponent implements OnInit, OnDestroy {
  @ViewChild('carouselTrack') carouselTrack?: ElementRef;
  
  campaign: Campaign | null = null;
  loading = true;
  error: string | null = null;
  currentImageIndex = 0;
  private autoSlideInterval: any;
  isBrowser: boolean;
  slideWidth = 0;

  constructor(
    private route: ActivatedRoute,
    private campaignService: CampaignService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadCampaign();
    if (this.isBrowser) {
      window.addEventListener('resize', this.updateSlideWidth.bind(this));
    }
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
    if (this.isBrowser) {
      window.removeEventListener('resize', this.updateSlideWidth.bind(this));
    }
  }

  private updateSlideWidth(): void {
    if (this.isBrowser && this.carouselTrack?.nativeElement) {
      this.slideWidth = this.carouselTrack.nativeElement.offsetWidth;
    }
  }

  private loadCampaign(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID de campaña no válido';
      this.loading = false;
      return;
    }

    this.campaignService.getCampaign(Number(id)).subscribe({
      next: (campaign) => {
        console.log('Campaña cargada:', campaign);
        this.campaign = campaign;
        this.loading = false;
        if (this.isBrowser && campaign.image_urls && campaign.image_urls.length > 1) {
          setTimeout(() => {
            this.updateSlideWidth();
            this.startAutoSlide();
          }, 0);
        }
      },
      error: (error) => {
        console.error('Error loading campaign:', error);
        this.error = 'Error al cargar la campaña. Por favor, intenta de nuevo.';
        this.loading = false;
      }
    });
  }

  getProgressPercentage(): number {
    if (!this.campaign?.goal_amount || !this.campaign?.current_amount) return 0;
    return Math.min((this.campaign.current_amount / this.campaign.goal_amount) * 100, 100);
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/images/default-campaign.jpg';
  }

  goToImage(index: number): void {
    if (!this.isBrowser) return;
    this.currentImageIndex = index;
    this.resetAutoSlide();
  }

  getInnerTranslateValue(): number {
    if (!this.isBrowser || !this.campaign) return 0;
    return -this.currentImageIndex * this.slideWidth;
  }

  private startAutoSlide(): void {
    if (!this.isBrowser || !this.campaign?.image_urls?.length) return;
    
    this.stopAutoSlide();
    this.autoSlideInterval = setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.campaign!.image_urls!.length;
    }, 5000);
  }

  private stopAutoSlide(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  private resetAutoSlide(): void {
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  getRemainingDays(): number {
    if (!this.campaign?.end_date) return 30;
    const endDate = new Date(this.campaign.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  onDonate() {
    // Implementar la lógica de donación aquí
    console.log('Implementar lógica de donación');
  }
}
