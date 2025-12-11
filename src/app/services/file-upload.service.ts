import { Injectable } from '@angular/core';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { environment } from '../../environments/environment';

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private containerClient: ContainerClient | null = null;

  constructor() {
    this.initializeAzureStorage();
  }

  private initializeAzureStorage(): void {
    try {
      const { accountName, sasToken, containerName } = environment.azureStorage;

      if (!accountName || !sasToken || accountName === 'YOUR_STORAGE_ACCOUNT_NAME') {
        console.warn('Azure Storage not configured. Please update environment.ts');
        return;
      }

      const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net?${sasToken}`
      );
      this.containerClient = blobServiceClient.getContainerClient(containerName);
    } catch (error) {
      console.error('Error initializing Azure Storage:', error);
    }
  }

  async uploadFile(file: File): Promise<UploadProgress> {
    const uploadProgress: UploadProgress = {
      fileName: file.name,
      progress: 0,
      status: 'pending'
    };

    try {
      if (!this.containerClient) {
        throw new Error('Azure Storage not configured. Please update environment.ts with your storage account details.');
      }

      uploadProgress.status = 'uploading';

      const blobName = `${Date.now()}_${file.name}`;
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(file, {
        blobHTTPHeaders: {
          blobContentType: file.type
        },
        onProgress: (progressEvent) => {
          if (progressEvent.loadedBytes && file.size) {
            uploadProgress.progress = Math.round((progressEvent.loadedBytes / file.size) * 100);
          }
        }
      });

      uploadProgress.status = 'completed';
      uploadProgress.progress = 100;
      uploadProgress.url = blockBlobClient.url;

      return uploadProgress;
    } catch (error) {
      uploadProgress.status = 'error';
      uploadProgress.error = error instanceof Error ? error.message : 'Upload failed';
      throw error;
    }
  }

  async uploadMultipleFiles(files: File[]): Promise<UploadProgress[]> {
    const uploadPromises = files.map(file => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }
}
