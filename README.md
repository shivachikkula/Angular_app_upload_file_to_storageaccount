# Angular File Upload App

A modern, feature-rich Angular application for uploading files to Azure Storage Account with drag-and-drop support, upload progress tracking, and a beautiful UI.

## Features

- **Drag and Drop**: Intuitive drag-and-drop interface for file uploads
- **Multiple File Upload**: Upload multiple files simultaneously
- **Progress Tracking**: Real-time upload progress for each file
- **Azure Storage Integration**: Direct upload to Azure Blob Storage
- **File Preview**: Visual file type indicators with icons
- **Responsive Design**: Mobile-friendly interface
- **Modern UI**: Beautiful gradient design with smooth animations

## Screenshots

The app features:
- A drag-and-drop upload zone
- Selected files list with file information
- Real-time upload progress with visual indicators
- Success/error status for each file

## Prerequisites

Before running this application, ensure you have:

- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (`npm install -g @angular/cli`)
- An Azure Storage Account with a blob container

## Azure Storage Setup

1. Create an Azure Storage Account:
   - Go to [Azure Portal](https://portal.azure.com)
   - Create a new Storage Account
   - Create a blob container (e.g., "uploads")

2. Generate a SAS Token:
   - Navigate to your Storage Account
   - Go to "Shared access signature"
   - Grant permissions: Read, Write, Create, List
   - Set expiration date
   - Generate SAS token

3. Configure the application:
   - Open `src/environments/environment.ts`
   - Replace the following values:
     - `accountName`: Your storage account name
     - `sasToken`: Your SAS token (without the leading `?`)
     - `containerName`: Your container name

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Angular_app_upload_file_to_storageaccount
```

2. Install dependencies:
```bash
npm install
```

3. Configure Azure Storage:
   - Edit `src/environments/environment.ts`
   - Add your Azure Storage credentials

## Running the Application

### Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

### Build

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Usage

1. **Select Files**:
   - Click "Choose Files" button, or
   - Drag and drop files onto the upload zone

2. **Review Selected Files**:
   - View file names, types, and sizes
   - Remove unwanted files using the ✕ button
   - Clear all files with "Clear All"

3. **Upload**:
   - Click "Upload Files" button
   - Monitor upload progress for each file
   - View uploaded file URLs upon completion

## Project Structure

```
src/
├── app/
│   ├── file-upload/
│   │   ├── file-upload.component.ts      # Main upload component
│   │   ├── file-upload.component.html    # Upload UI template
│   │   └── file-upload.component.css     # Upload component styles
│   ├── services/
│   │   └── file-upload.service.ts        # Azure Storage service
│   ├── app.component.ts                  # Root component
│   ├── app.component.html                # Root template
│   └── app.component.css                 # Root styles
├── environments/
│   └── environment.ts                    # Environment configuration
├── index.html                            # Main HTML file
├── main.ts                               # Application entry point
└── styles.css                            # Global styles
```

## Technologies Used

- **Angular 17**: Latest Angular framework with standalone components
- **TypeScript**: Type-safe development
- **Azure Storage SDK**: @azure/storage-blob for Azure integration
- **CSS3**: Modern styling with gradients and animations
- **RxJS**: Reactive programming

## Configuration

### Environment Variables

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  azureStorage: {
    accountName: 'YOUR_STORAGE_ACCOUNT_NAME',
    sasToken: 'YOUR_SAS_TOKEN',
    containerName: 'uploads'
  }
};
```

## Security Notes

- Never commit your SAS token to version control
- Use environment-specific configuration files
- Set appropriate expiration dates for SAS tokens
- Grant minimal required permissions
- Consider using Azure Active Directory for production

## Troubleshooting

### Upload fails with 403 error
- Check if your SAS token is valid and not expired
- Verify the container permissions
- Ensure the container name matches your configuration

### Files not uploading
- Check browser console for errors
- Verify Azure Storage configuration in `environment.ts`
- Ensure CORS is enabled on your storage account

### Application won't start
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version compatibility
- Clear npm cache: `npm cache clean --force`

## Future Enhancements

- File type validation
- File size limits
- Image preview before upload
- Bulk upload with retry logic
- Upload history
- Download uploaded files
- Delete files from storage

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.