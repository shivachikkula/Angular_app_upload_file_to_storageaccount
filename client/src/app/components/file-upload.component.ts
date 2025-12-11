import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AzureStorageService } from '../services/azure-storage.service';
import { AppInsightsService } from '../services/app-insights.service';
import { BlobListItem } from '../models/sas-token.model';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  selectedFile: File | null = null;
  uploadProgress: number = 0;
  isUploading: boolean = false;
  uploadSuccess: boolean = false;
  uploadError: string | null = null;
  blobs: BlobListItem[] = [];
  isLoadingBlobs: boolean = false;
  downloadingBlobs: Set<string> = new Set();

  constructor(
    private storageService: AzureStorageService,
    private appInsights: AppInsightsService
  ) {
    this.loadBlobs();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadError = null;
      this.uploadSuccess = false;
      this.appInsights.logEvent('FileSelected', {
        fileName: this.selectedFile.name,
        fileSize: this.selectedFile.size,
        fileType: this.selectedFile.type
      });
    }
  }

  async uploadFile(): Promise<void> {
    if (!this.selectedFile) {
      this.uploadError = 'Please select a file first';
      return;
    }

    try {
      this.isUploading = true;
      this.uploadProgress = 0;
      this.uploadError = null;
      this.uploadSuccess = false;

      this.appInsights.logEvent('UploadStarted', {
        fileName: this.selectedFile.name
      });

      // Get SAS token from API
      const sasToken = await this.storageService.getUploadToken(
        this.selectedFile.name,
        this.selectedFile.type || 'application/octet-stream'
      ).toPromise();

      if (!sasToken) {
        throw new Error('Failed to get SAS token');
      }

      // Upload file to Azure Storage
      await this.storageService.uploadFile(
        this.selectedFile,
        sasToken,
        (progress) => {
          this.uploadProgress = Math.round(progress);
        }
      );

      this.uploadSuccess = true;
      this.uploadProgress = 100;
      this.selectedFile = null;

      // Reset file input
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      this.appInsights.logEvent('UploadCompleted');

      // Reload blob list
      await this.loadBlobs();

    } catch (error) {
      this.uploadError = error instanceof Error ? error.message : 'Upload failed';
      this.appInsights.logException(error as Error);
      console.error('Upload error:', error);
    } finally {
      this.isUploading = false;
    }
  }

  async loadBlobs(): Promise<void> {
    try {
      this.isLoadingBlobs = true;
      this.blobs = await this.storageService.listBlobs().toPromise() || [];
    } catch (error) {
      console.error('Error loading blobs:', error);
      this.appInsights.logException(error as Error);
    } finally {
      this.isLoadingBlobs = false;
    }
  }

  async downloadFile(blob: BlobListItem): Promise<void> {
    try {
      this.downloadingBlobs.add(blob.name);
      this.appInsights.logEvent('DownloadStarted', { blobName: blob.name });

      // Get download SAS token
      const sasToken = await this.storageService.getDownloadToken(blob.name).toPromise();

      if (!sasToken) {
        throw new Error('Failed to get download SAS token');
      }

      // Download file
      await this.storageService.downloadFile(blob.name, sasToken);

      this.appInsights.logEvent('DownloadCompleted', { blobName: blob.name });

    } catch (error) {
      console.error('Download error:', error);
      this.appInsights.logException(error as Error);
      alert(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.downloadingBlobs.delete(blob.name);
    }
  }

  isDownloading(blobName: string): boolean {
    return this.downloadingBlobs.has(blobName);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(date?: Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }
}
