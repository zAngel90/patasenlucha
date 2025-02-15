import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { News } from '../../models/news.model';
import { NewsService } from '../../services/news.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss']
})
export class NewsComponent implements OnInit, OnDestroy {
  news: News[] = [];
  loading = true;
  error: string | null = null;
  currentImageIndices: { [key: number]: number } = {};
  carouselIntervals: { [key: number]: any } = {};

  constructor(private newsService: NewsService) {}

  ngOnInit(): void {
    this.loadNews();
  }

  ngOnDestroy(): void {
    // Limpiar todos los intervalos al destruir el componente
    Object.values(this.carouselIntervals).forEach(interval => {
      if (interval) clearInterval(interval);
    });
  }

  loadNews(): void {
    this.loading = true;
    this.error = null;
    
    this.newsService.getPublicNews().subscribe({
      next: (news) => {
        this.news = news;
        this.loading = false;
        // Inicializar índices del carrusel para cada noticia
        this.news.forEach(item => {
          if (item.id) {
            this.currentImageIndices[item.id] = 0;
            this.startCarousel(item.id);
          }
        });
      },
      error: (error) => {
        console.error('Error loading news:', error);
        this.error = 'Error al cargar las noticias. Por favor, intenta de nuevo.';
        this.loading = false;
      }
    });
  }

  startCarousel(newsId: number): void {
    if (this.carouselIntervals[newsId]) {
      clearInterval(this.carouselIntervals[newsId]);
    }

    const news = this.news.find(n => n.id === newsId);
    if (news?.image_urls && news.image_urls.length > 1) {
      this.carouselIntervals[newsId] = setInterval(() => {
        this.currentImageIndices[newsId] = 
          (this.currentImageIndices[newsId] + 1) % news.image_urls!.length;
      }, 5000);
    }
  }

  getCurrentImage(news: News): string {
    if (!news.id || !news.image_urls || news.image_urls.length === 0) {
      return 'assets/images/default-news.jpg';
    }
    return news.image_urls[this.currentImageIndices[news.id]];
  }

  goToImage(newsId: number, index: number, event: Event): void {
    event.stopPropagation();
    if (this.currentImageIndices[newsId] !== undefined) {
      this.currentImageIndices[newsId] = index;
      this.startCarousel(newsId);
    }
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/images/default-news.jpg';
  }
} 