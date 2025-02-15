import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Campaign } from '../../models/campaign.model';
import { CampaignService } from '../../services/campaign.service';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  campaigns: Campaign[] = [];
  displayCampaigns: Campaign[] = [];
  currentIndex = 0;
  translateValue = 0;
  private autoSlideInterval: any;
  loading = true;
  error: string | null = null;
  slideWidth = 0;
  touchStartX = 0;
  isBrowser: boolean;
  private innerCarouselIntervals: Map<number, any> = new Map();
  private innerCurrentIndices: Map<number, number> = new Map();

  constructor(
    private campaignService: CampaignService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadCampaigns();
    if (this.isBrowser) {
      this.calculateSlideWidth();
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.stopAutoSlide();
    }
    this.innerCarouselIntervals.forEach(interval => clearInterval(interval));
  }

  private setupCarousel(): void {
    if (!this.isBrowser || !this.campaigns.length) return;

    if (this.campaigns.length === 1) {
      this.displayCampaigns = [...this.campaigns];
      this.currentIndex = 0;
    } else {
      this.displayCampaigns = [
        ...this.campaigns.slice(-1),
        ...this.campaigns,
        ...this.campaigns.slice(0, 1)
      ];
      this.currentIndex = 1;
      this.startAutoSlide();
    }
    
    this.updateTranslateValue();
  }

  private calculateSlideWidth(): void {
    if (!this.isBrowser) return;
    this.slideWidth = window.innerWidth >= 1200 ? 
      Math.min(1000, window.innerWidth * 0.8) :
      window.innerWidth - 32;
  }

  private startAutoSlide(): void {
    if (!this.isBrowser || this.campaigns.length <= 1) return;
    
    this.stopAutoSlide();
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  private stopAutoSlide(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  private enableTransition(): void {
    if (!this.isBrowser) return;
    
    const track = document.querySelector('.carousel-track') as HTMLElement;
    if (track) {
      track.style.transition = 'transform 0.5s ease-in-out';
    }
  }

  private disableTransition(): void {
    if (!this.isBrowser) return;
    
    const track = document.querySelector('.carousel-track') as HTMLElement;
    if (track) {
      track.style.transition = 'none';
    }
  }

  private updateTranslateValue(animate: boolean = true): void {
    if (!this.isBrowser) return;

    if (animate) {
      this.enableTransition();
    } else {
      this.disableTransition();
    }
    this.translateValue = -this.slideWidth * this.currentIndex;
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.isBrowser) return;
    
    this.calculateSlideWidth();
    this.updateTranslateValue(false);
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (!this.isBrowser) return;
    
    this.touchStartX = event.touches[0].clientX;
    this.stopAutoSlide();
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (!this.isBrowser) return;
    
    const touchEndX = event.changedTouches[0].clientX;
    const diff = this.touchStartX - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    }

    this.startAutoSlide();
  }

  nextSlide(): void {
    if (!this.isBrowser || !this.campaigns.length || this.campaigns.length === 1) return;
    
    this.currentIndex++;
    this.updateTranslateValue();

    if (this.currentIndex >= this.displayCampaigns.length - 1) {
      setTimeout(() => {
        this.currentIndex = 1;
        this.updateTranslateValue(false);
      }, 500);
    }
  }

  prevSlide(): void {
    if (!this.isBrowser || !this.campaigns.length || this.campaigns.length === 1) return;
    
    this.currentIndex--;
    this.updateTranslateValue();

    if (this.currentIndex <= 0) {
      setTimeout(() => {
        this.currentIndex = this.displayCampaigns.length - 2;
        this.updateTranslateValue(false);
      }, 500);
    }
  }

  goToSlide(index: number): void {
    if (!this.isBrowser) return;
    
    this.stopAutoSlide();
    this.currentIndex = index + 1;
    this.updateTranslateValue();
    this.startAutoSlide();
  }

  getInnerCurrentIndex(campaign: Campaign): number {
    return this.innerCurrentIndices.get(campaign.id!) || 0;
  }

  getInnerTranslateValue(campaign: Campaign): number {
    if (!this.isBrowser) return 0;
    const currentIndex = this.getInnerCurrentIndex(campaign);
    const slideWidth = this.getSlideWidth();
    return -currentIndex * slideWidth;
  }

  private getSlideWidth(): number {
    if (!this.isBrowser) return 0;
    const slide = document.querySelector('.inner-carousel-slide');
    return slide?.clientWidth || 0;
  }

  goToInnerSlide(event: Event, campaign: Campaign, index: number): void {
    event.stopPropagation();
    this.innerCurrentIndices.set(campaign.id!, index);
    this.resetInnerAutoPlay(campaign);
  }

  private startInnerAutoPlay(campaign: Campaign): void {
    if (!this.isBrowser || this.innerCarouselIntervals.has(campaign.id!)) {
      return;
    }

    if ((campaign.image_urls?.length || 0) > 1) {
      const interval = setInterval(() => {
        const currentIndex = this.getInnerCurrentIndex(campaign);
        const nextIndex = (currentIndex + 1) % (campaign.image_urls?.length || 1);
        this.innerCurrentIndices.set(campaign.id!, nextIndex);
      }, 5000);

      this.innerCarouselIntervals.set(campaign.id!, interval);
    }
  }

  private resetInnerAutoPlay(campaign: Campaign): void {
    this.startInnerAutoPlay(campaign);
  }

  loadCampaigns(): void {
    this.loading = true;
    this.error = null;
    this.campaignService.getApprovedCampaigns().subscribe({
      next: (campaigns) => {
        this.campaigns = campaigns;
        this.displayCampaigns = [...campaigns];
        this.loading = false;
        
        this.campaigns.forEach(campaign => {
          this.innerCurrentIndices.set(campaign.id!, 0);
          this.startInnerAutoPlay(campaign);
        });
      },
      error: (error) => {
        console.error('Error loading campaigns:', error);
        this.error = 'Error al cargar las campañas. Por favor, intenta de nuevo.';
        this.loading = false;
      }
    });
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/images/default-campaign.jpg';
  }

  getDaysLeft(campaign: Campaign): number {
    if (!campaign.end_date) return 0;
    const endDate = new Date(campaign.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  getProgressPercentage(campaign: Campaign): number {
    if (!campaign.goal_amount || campaign.goal_amount <= 0) return 0;
    const currentAmount = campaign.current_amount || 0;
    return Math.min(100, (currentAmount / campaign.goal_amount) * 100);
  }

  isUrgent(campaign: Campaign): boolean {
    if (!campaign.end_date) return false;
    const daysLeft = this.getDaysLeft(campaign);
    const progressPercentage = this.getProgressPercentage(campaign);
    return daysLeft <= 7 && progressPercentage < 80;
  }

  getCampaignStatus(campaign: Campaign): string {
    if (this.isUrgent(campaign)) {
      return '¡Urgente!';
    }
    const progressPercentage = this.getProgressPercentage(campaign);
    if (progressPercentage >= 100) {
      return '¡Meta alcanzada!';
    }
    return `${this.getDaysLeft(campaign)} días restantes`;
  }

  getAvatarColor(name: string | undefined): string {
    if (!name) return '#ff6b35';
    const colors = [
      '#ff6b35', '#4ecdc4', '#45b7d1', '#96ceb4', '#ff9f1c',
      '#2ab7ca', '#fed766', '#fe4a49', '#851e3e', '#6c464f'
    ];
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }
}
