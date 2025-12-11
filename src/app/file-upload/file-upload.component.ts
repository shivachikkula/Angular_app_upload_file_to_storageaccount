import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadService, UploadProgress } from '../services/file-upload.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  selectedFiles: File[] = [];
  uploadProgress: UploadProgress[] = [];
  isDragging = false;
  isUploading = false;

  constructor(private fileUploadService: FileUploadService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.selectedFiles = Array.from(event.dataTransfer.files);
    }
  }

  async uploadFiles(): Promise<void> {
    if (this.selectedFiles.length === 0) {
      return;
    }

    this.isUploading = true;
    this.uploadProgress = [];

    try {
      for (const file of this.selectedFiles) {
        try {
          const progress = await this.fileUploadService.uploadFile(file);
          this.uploadProgress.push(progress);
        } catch (error) {
          this.uploadProgress.push({
            fileName: file.name,
            progress: 0,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed'
          });
        }
      }
    } finally {
      this.isUploading = false;
    }
  }

  removeFile(index: number): void {
    this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
  }

  clearAll(): void {
    this.selectedFiles = [];
    this.uploadProgress = [];
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getFileIcon(file: File): string {
    const type = file.type;
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('text')) return '📝';
    if (type.includes('zip') || type.includes('compressed')) return '📦';
    return '📁';
  }
}
