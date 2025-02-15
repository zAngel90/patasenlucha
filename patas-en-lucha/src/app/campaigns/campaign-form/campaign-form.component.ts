import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CampaignService } from '../../services/campaign.service';

@Component({
  selector: 'app-campaign-form',
  templateUrl: './campaign-form.component.html',
  styleUrls: ['./campaign-form.component.scss']
})
export class CampaignFormComponent {
  campaignForm: FormGroup;
  error: string = '';
  loading: boolean = false;
  imagePreview: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private campaignService: CampaignService,
    private router: Router
  ) {
    this.campaignForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      goal_amount: ['', [Validators.required, Validators.min(1)]],
      image: [null, [Validators.required]]
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        this.error = 'Por favor selecciona un archivo de imagen válido';
        return;
      }

      this.selectedFile = file;

      // Crear preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);

      this.campaignForm.patchValue({
        image: file
      });
    }
  }

  onSubmit(): void {
    if (this.campaignForm.valid && this.selectedFile) {
      this.loading = true;
      this.error = '';

      // Primero subimos la imagen
      this.campaignService.uploadImage(this.selectedFile).subscribe({
        next: (response) => {
          // Una vez que tenemos la URL de la imagen, creamos la campaña
          const campaignData = {
            title: this.campaignForm.value.title,
            description: this.campaignForm.value.description,
            goal_amount: this.campaignForm.value.goal_amount,
            image_url: response.imageUrl
          };

          this.campaignService.createCampaign(campaignData).subscribe({
            next: () => {
              this.router.navigate(['/campaigns']);
            },
            error: (error) => {
              this.error = error.error.message || 'Error al crear la campaña';
              this.loading = false;
            }
          });
        },
        error: (error) => {
          this.error = error.error.message || 'Error al subir la imagen';
          this.loading = false;
        }
      });
    }
  }
}
