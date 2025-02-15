import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CampaignService } from '../../services/campaign.service';
import { CampaignStatus } from '../../models/campaign.model';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-create-campaign',
  templateUrl: './create-campaign.component.html',
  styleUrls: ['./create-campaign.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class CreateCampaignComponent {
  campaignForm: FormGroup;
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  selectedMedicalProof: File | null = null;
  medicalProofPreview: string | null = null;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  maxImages = 3;

  proofTypes = [
    { value: 'factura', label: 'Factura o ticket de gastos veterinarios' },
    { value: 'diagnostico', label: 'Diagnóstico médico veterinario' },
    { value: 'receta', label: 'Receta médica veterinaria' },
    { value: 'informe', label: 'Informe clínico veterinario' }
  ];

  constructor(
    private fb: FormBuilder,
    private campaignService: CampaignService,
    private router: Router
  ) {
    this.campaignForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      goal_amount: ['', [Validators.required, Validators.min(1)]],
      proof_type: ['', [Validators.required]],
      proof_description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      if (this.selectedFiles.length + files.length > this.maxImages) {
        this.error = `Solo se permiten hasta ${this.maxImages} imágenes`;
        return;
      }

      Array.from(files).forEach((file) => {
        if (file instanceof File && this.selectedFiles.length < this.maxImages) {
          if (!file.type.startsWith('image/')) {
            this.error = 'Solo se permiten archivos de imagen';
            return;
          }
          this.selectedFiles.push(file);
          const reader = new FileReader();
          reader.onload = () => {
            this.imagePreviews.push(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  onMedicalProofSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        this.error = 'Solo se permiten imágenes o archivos PDF como comprobante médico';
        return;
      }
      this.selectedMedicalProof = file;
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.medicalProofPreview = reader.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.medicalProofPreview = 'assets/images/pdf-icon.png'; // Asegúrate de tener este icono
      }
    }
  }

  removeImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  removeMedicalProof(): void {
    this.selectedMedicalProof = null;
    this.medicalProofPreview = null;
  }

  async onSubmit(): Promise<void> {
    if (this.campaignForm.invalid) {
      this.error = 'Por favor, completa todos los campos requeridos';
      return;
    }

    if (this.selectedFiles.length === 0) {
      this.error = 'Debes subir al menos una imagen de la campaña';
      return;
    }

    if (!this.selectedMedicalProof) {
      this.error = 'Debes subir un comprobante médico';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      const formData = new FormData();
      
      // Datos básicos de la campaña
      Object.keys(this.campaignForm.value).forEach(key => {
        formData.append(key, this.campaignForm.get(key)?.value);
      });

      // Agregar imágenes de la campaña
      this.selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      // Agregar comprobante médico
      formData.append('medical_proof', this.selectedMedicalProof);

      const response = await this.campaignService.createCampaign(formData).toPromise();
      this.success = '¡Campaña creada exitosamente! Tu campaña ha sido enviada a revisión. Nuestro equipo la revisará lo antes posible.';
      
      // Mostrar el mensaje por 3 segundos antes de redirigir
      setTimeout(() => {
        this.router.navigate(['/campaigns']);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error al crear la campaña:', error);
      this.error = error.error?.message || 'Error al crear la campaña. Por favor, verifica todos los campos e intenta nuevamente.';
    } finally {
      this.loading = false;
    }
  }
}
