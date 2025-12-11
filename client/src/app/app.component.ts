import { Component } from '@angular/core';
import { FileUploadComponent } from './components/file-upload.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FileUploadComponent],
  template: '<app-file-upload></app-file-upload>'
})
export class AppComponent {
  title = 'azure-storage-client';
}
