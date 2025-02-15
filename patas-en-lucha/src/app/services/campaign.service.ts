import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Campaign } from '../models/campaign.model';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  }

  private addBaseUrlToImages(campaign: Campaign): Campaign {
    const updatedCampaign = {
      ...campaign,
      image_urls: campaign.image_urls?.map(url => {
        if (url.startsWith('http')) return url;
        // Eliminar la barra inicial si existe
        const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
        return `${this.apiUrl}/${cleanUrl}`;
      }) || []
    };

    // Agregar URL base al comprobante médico si existe
    if (updatedCampaign.medical_proof) {
      const medicalProofUrl = updatedCampaign.medical_proof;
      if (!medicalProofUrl.startsWith('http')) {
        const cleanUrl = medicalProofUrl.startsWith('/') ? medicalProofUrl.substring(1) : medicalProofUrl;
        updatedCampaign.medical_proof = `${this.apiUrl}/${cleanUrl}`;
      }
    }

    return updatedCampaign;
  }

  getAllCampaigns(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.apiUrl}/api/campaigns`, { 
      headers: this.getHeaders() 
    }).pipe(
      map(campaigns => campaigns.map(campaign => this.addBaseUrlToImages(campaign)))
    );
  }

  getApprovedCampaigns(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.apiUrl}/api/campaigns/public`).pipe(
      map(campaigns => campaigns.map(campaign => this.addBaseUrlToImages(campaign)))
    );
  }

  getPendingCampaigns(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.apiUrl}/api/campaigns/pending`, { 
      headers: this.getHeaders() 
    }).pipe(
      map(campaigns => campaigns.map(campaign => this.addBaseUrlToImages(campaign)))
    );
  }

  getCampaign(id: number): Observable<Campaign> {
    return this.http.get<Campaign>(`${this.apiUrl}/api/campaigns/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(
      map(campaign => this.addBaseUrlToImages(campaign))
    );
  }

  createCampaign(campaignData: FormData): Observable<Campaign> {
    return this.http.post<Campaign>(`${this.apiUrl}/api/campaigns`, campaignData, {
      headers: this.getHeaders()
    }).pipe(
      map(campaign => this.addBaseUrlToImages(campaign))
    );
  }

  updateCampaignStatus(id: number, status: string): Observable<Campaign> {
    const endpoint = status === 'approved' ? 'approve' : 'reject';
    return this.http.patch<Campaign>(`${this.apiUrl}/api/campaigns/${id}/${endpoint}`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(campaign => this.addBaseUrlToImages(campaign))
    );
  }

  deleteCampaign(id: number): Observable<void> {
    console.log('Enviando solicitud de eliminación para campaña:', id);
    const headers = this.getHeaders();
    console.log('Headers de autorización:', headers.has('Authorization'));
    
    return this.http.delete<void>(`${this.apiUrl}/api/campaigns/${id}`, {
      headers: headers
    });
  }
}
