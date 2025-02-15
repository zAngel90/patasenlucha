import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { News } from '../models/news.model';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private addBaseUrlToImages(news: News): News {
    return {
      ...news,
      image_urls: news.image_urls?.map(url => {
        if (url.startsWith('http')) return url;
        const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
        return `${this.apiUrl}/${cleanUrl}`;
      }) || []
    };
  }

  getPublicNews(): Observable<News[]> {
    return this.http.get<News[]>(`${this.apiUrl}/api/news/public`).pipe(
      map(news => news.map(item => this.addBaseUrlToImages(item)))
    );
  }

  getNewsById(id: number): Observable<News> {
    return this.http.get<News>(`${this.apiUrl}/api/news/${id}`).pipe(
      map(news => this.addBaseUrlToImages(news))
    );
  }

  createNews(formData: FormData): Observable<News> {
    return this.http.post<News>(`${this.apiUrl}/api/news`, formData, {
      headers: this.getHeaders()
    }).pipe(
      map(news => this.addBaseUrlToImages(news))
    );
  }

  deleteNews(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/news/${id}`, {
      headers: this.getHeaders()
    });
  }
} 