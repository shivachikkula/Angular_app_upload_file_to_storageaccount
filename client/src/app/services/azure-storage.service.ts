import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { BlockBlobClient } from '@azure/storage-blob';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { SasTokenRequest, SasTokenResponse, BlobListItem } from '../models/sas-token.model';
import { AppInsightsService } from './app-insights.service';

@Injectable({
  providedIn: 'root'
})
export class AzureStorageService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private appInsights: AppInsightsService
  ) { }

  getUploadToken(fileName: string, contentType: string): Observable<SasTokenResponse> {
    const request: SasTokenRequest = { fileName, contentType };

    this.appInsights.logEvent('GetUploadToken', { fileName, contentType });

    return this.http.post<ApiResponse<SasTokenResponse>>(`${this.apiUrl}/storage/upload-token`, request)
      .pipe(
        tap(response => {
          this.appInsights.logEvent('UploadTokenReceived', { fileName });
        }),
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to get upload token');
        }),
        catchError(error => {
          this.appInsights.logException(error);
          return throwError(() => error);
        })
      );
  }

  getDownloadToken(blobName: string): Observable<SasTokenResponse> {
    this.appInsights.logEvent('GetDownloadToken', { blobName });

    return this.http.get<ApiResponse<SasTokenResponse>>(`${this.apiUrl}/storage/download-token/${encodeURIComponent(blobName)}`)
      .pipe(
        tap(response => {
          this.appInsights.logEvent('DownloadTokenReceived', { blobName });
        }),
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to get download token');
        }),
        catchError(error => {
          this.appInsights.logException(error);
          return throwError(() => error);
        })
      );
  }

  listBlobs(): Observable<BlobListItem[]> {
    this.appInsights.logEvent('ListBlobs');

    return this.http.get<ApiResponse<BlobListItem[]>>(`${this.apiUrl}/storage/blobs`)
      .pipe(
        tap(response => {
          this.appInsights.logEvent('BlobsListed', { count: response.data?.length || 0 });
        }),
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to list blobs');
        }),
        catchError(error => {
          this.appInsights.logException(error);
          return throwError(() => error);
        })
      );
  }

  async uploadFile(file: File, sasToken: SasTokenResponse, onProgress?: (progress: number) => void): Promise<void> {
    try {
      this.appInsights.logEvent('UploadFileStart', {
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type
      });

      const blockBlobClient = new BlockBlobClient(sasToken.blobUri);

      await blockBlobClient.uploadData(file, {
        blobHTTPHeaders: {
          blobContentType: file.type
        },
        onProgress: (progress) => {
          const percentComplete = (progress.loadedBytes / file.size) * 100;
          if (onProgress) {
            onProgress(percentComplete);
          }
          this.appInsights.logMetric('UploadProgress', percentComplete, {
            fileName: file.name,
            loadedBytes: progress.loadedBytes,
            totalBytes: file.size
          });
        }
      });

      this.appInsights.logEvent('UploadFileComplete', {
        fileName: file.name,
        fileSize: file.size,
        blobName: sasToken.blobName
      });
    } catch (error) {
      this.appInsights.logException(error as Error);
      throw error;
    }
  }

  async downloadFile(blobName: string, sasToken: SasTokenResponse): Promise<void> {
    try {
      this.appInsights.logEvent('DownloadFileStart', { blobName });

      const response = await fetch(sasToken.blobUri);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Extract original filename from blobName (remove GUID prefix)
      const fileName = blobName.includes('_') ? blobName.substring(blobName.indexOf('_') + 1) : blobName;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.appInsights.logEvent('DownloadFileComplete', { blobName });
    } catch (error) {
      this.appInsights.logException(error as Error);
      throw error;
    }
  }
}
