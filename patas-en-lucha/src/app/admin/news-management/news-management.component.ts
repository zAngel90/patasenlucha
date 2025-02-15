import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NewsService } from '../../services/news.service';
import { News } from '../../models/news.model';

@Component({
  selector: 'app-news-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './news-management.component.html',
  styleUrls: ['./news-management.component.scss']
})
export class NewsManagementComponent implements OnInit {
  newsForm: FormGroup;
  selectedFiles: File[] = [];
  loading = false;
  news: News[] = [];
  previewUrls: string[] = [];
  maxImages = 5;

  constructor(
    private fb: FormBuilder,
    private newsService: NewsService,
    private snackBar: MatSnackBar
  ) {
    this.newsForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      content: ['', [Validators.required, Validators.minLength(20)]]
    });
  }

  ngOnInit(): void {
    this.loadNews();
  }

  loadNews(): void {
    this.loading = true;
    this.newsService.getPublicNews().subscribe({
      next: (news) => {
        this.news = news;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading news:', error);
        this.snackBar.open('Error al cargar las noticias', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const files = Array.from(event.target.files || []) as File[];
    
    // Verificar si excedemos el límite de imágenes
    if (this.selectedFiles.length + files.length > this.maxImages) {
      this.snackBar.open(`Solo se permiten hasta ${this.maxImages} imágenes`, 'Cerrar', { duration: 3000 });
      return;
    }

    // Agregar los nuevos archivos al array existente
    this.selectedFiles = [...this.selectedFiles, ...files];
    
    // Generar previsualizaciones para las nuevas imágenes
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrls.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  onSubmit(): void {
    if (this.newsForm.valid) {
      this.loading = true;
      const formData = new FormData();
      formData.append('title', this.newsForm.get('title')?.value);
      formData.append('content', this.newsForm.get('content')?.value);
      
      this.selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      this.newsService.createNews(formData).subscribe({
        next: () => {
          this.snackBar.open('Noticia creada exitosamente', 'Cerrar', { duration: 3000 });
          this.newsForm.reset();
          this.selectedFiles = [];
          this.previewUrls = [];
          this.loadNews();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error creating news:', error);
          this.snackBar.open('Error al crear la noticia', 'Cerrar', { duration: 3000 });
          this.loading = false;
        }
      });
    }
  }

  deleteNews(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta noticia?')) {
      this.loading = true;
      this.newsService.deleteNews(id).subscribe({
        next: () => {
          this.snackBar.open('Noticia eliminada exitosamente', 'Cerrar', { duration: 3000 });
          this.loadNews();
        },
        error: (error) => {
          console.error('Error deleting news:', error);
          this.snackBar.open('Error al eliminar la noticia', 'Cerrar', { duration: 3000 });
          this.loading = false;
        }
      });
    }
  }
} 