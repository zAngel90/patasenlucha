import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { News } from '../../models/news.model';
import { NewsService } from '../../services/news.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-news-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './news-details.component.html',
  styleUrls: ['./news-details.component.scss']
})
export class NewsDetailsComponent implements OnInit, OnDestroy {
  news: News | null = null;
  loading = true;
  error: string | null = null;
  currentImageIndex = 0;
  private carouselInterval: any;

  constructor(
    private route: ActivatedRoute,
    private newsService: NewsService
  ) {}

  ngOnInit(): void {
    this.loadNews();
  }

  ngOnDestroy(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  loadNews(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID de noticia no válido';
      this.loading = false;
      return;
    }

    console.log('Cargando noticia con ID:', id);
    this.newsService.getNewsById(Number(id)).subscribe({
      next: (news) => {
        console.log('Noticia cargada:', news);
        this.news = news;
        this.loading = false;
        if (news.image_urls && news.image_urls.length > 1) {
          console.log('Iniciando carrusel con imágenes:', news.image_urls);
          this.startCarousel();
        }
      },
      error: (error) => {
        console.error('Error loading news:', error);
        this.error = 'Error al cargar la noticia. Por favor, intenta de nuevo.';
        this.loading = false;
      }
    });
  }

  startCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }

    if (this.news?.image_urls && this.news.image_urls.length > 1) {
      this.carouselInterval = setInterval(() => {
        this.currentImageIndex = (this.currentImageIndex + 1) % this.news!.image_urls!.length;
      }, 5000);
    }
  }

  getImageUrl(): string {
    console.log('Obteniendo URL de imagen:', {
      news: this.news,
      currentIndex: this.currentImageIndex,
      imageUrls: this.news?.image_urls
    });
    
    if (!this.news?.image_urls || this.news.image_urls.length === 0) {
      console.log('Usando imagen por defecto');
      return 'assets/images/default-news.jpg';
    }
    
    const imageUrl = this.news.image_urls[this.currentImageIndex];
    console.log('URL de imagen seleccionada:', imageUrl);
    return imageUrl;
  }

  goToImage(index: number, event: Event): void {
    event.stopPropagation();
    this.currentImageIndex = index;
    this.startCarousel();
  }

  prevImage(event: Event): void {
    event.stopPropagation();
    if (!this.news?.image_urls) return;
    this.currentImageIndex = (this.currentImageIndex - 1 + this.news.image_urls.length) % this.news.image_urls.length;
    this.startCarousel();
  }

  nextImage(event: Event): void {
    event.stopPropagation();
    if (!this.news?.image_urls) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % this.news.image_urls.length;
    this.startCarousel();
  }

  handleImageError(event: any): void {
    console.log('Error al cargar imagen, usando imagen por defecto');
    event.target.src = 'assets/images/default-news.jpg';
  }
} 