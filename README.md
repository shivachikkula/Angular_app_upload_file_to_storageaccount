# Azure Storage File Upload/Download Application

A full-stack application for uploading and downloading files to Azure Blob Storage using User Delegation SAS tokens. Built with Angular 17 (with Tailwind CSS) for the frontend and .NET 8 Web API for the backend, featuring comprehensive logging with Azure Application Insights.

## Features

- **Secure File Upload**: Upload files directly to Azure Blob Storage using User Delegation SAS tokens
- **File Download**: Download files from Azure Blob Storage with secure SAS tokens
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- **Comprehensive Logging**: Azure Application Insights integration for both client and server
- **Error Handling**: Robust exception handling on both frontend and backend
- **Real-time Progress**: Upload progress tracking with visual feedback
- **File Management**: List all uploaded files with metadata (size, type, last modified)

## Architecture

### Frontend (Angular 17)
- Standalone components architecture
- Tailwind CSS for styling
- Azure Storage Blob SDK for direct uploads
- Application Insights for client-side logging
- HTTP interceptor for error handling

### Backend (.NET 8 Web API)
- User Delegation SAS token generation
- Azure Storage integration
- Application Insights telemetry
- Global exception handling middleware
- CORS support for Angular client

## Prerequisites

1. **Azure Resources**:
   - Azure Storage Account
   - Azure Active Directory App Registration
   - Azure Application Insights resource

2. **Development Tools**:
   - Node.js (v18 or later)
   - .NET 8 SDK
   - Angular CLI (`npm install -g @angular/cli`)

## Azure Setup

### 1. Create Azure Storage Account

```bash
# Create a resource group (if you don't have one)
az group create --name MyResourceGroup --location eastus

# Create a storage account
az storage account create \
  --name mystorageaccount \
  --resource-group MyResourceGroup \
  --location eastus \
  --sku Standard_LRS

# Create a blob container
az storage container create \
  --name uploads \
  --account-name mystorageaccount
```

### 2. Create Azure AD App Registration

1. Go to Azure Portal > Azure Active Directory > App registrations
2. Click "New registration"
3. Name: "AzureStorageUploadApp"
4. Click "Register"
5. Note the **Application (client) ID** and **Directory (tenant) ID**
6. Go to "Certificates & secrets" > "New client secret"
7. Copy the **client secret value** (you won't be able to see it again)

### 3. Assign Storage Permissions

```bash
# Get your app's Object ID
APP_OBJECT_ID=$(az ad sp show --id YOUR_CLIENT_ID --query id -o tsv)

# Assign "Storage Blob Data Contributor" role
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee $APP_OBJECT_ID \
  --scope /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/MyResourceGroup/providers/Microsoft.Storage/storageAccounts/mystorageaccount
```

### 4. Create Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app MyAppInsights \
  --location eastus \
  --resource-group MyResourceGroup

# Get the connection string
az monitor app-insights component show \
  --app MyAppInsights \
  --resource-group MyResourceGroup \
  --query connectionString -o tsv
```

## Installation & Configuration

### Backend Setup

1. Navigate to the API directory:
```bash
cd api
```

2. Update `appsettings.json` with your Azure credentials:
```json
{
  "ApplicationInsights": {
    "ConnectionString": "YOUR_APPLICATION_INSIGHTS_CONNECTION_STRING"
  },
  "AzureStorage": {
    "AccountName": "YOUR_STORAGE_ACCOUNT_NAME",
    "ContainerName": "uploads",
    "TenantId": "YOUR_TENANT_ID",
    "ClientId": "YOUR_CLIENT_ID",
    "ClientSecret": "YOUR_CLIENT_SECRET"
  }
}
```

3. Restore dependencies and run:
```bash
dotnet restore
dotnet run
```

The API will start on `http://localhost:5000` (or `https://localhost:5001` for HTTPS).

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Update environment configuration in `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  appInsights: {
    connectionString: 'YOUR_APPLICATION_INSIGHTS_CONNECTION_STRING'
  }
};
```

4. Run the development server:
```bash
npm start
```

The application will open at `http://localhost:4200`.

## Usage

1. **Upload a File**:
   - Click on the upload area or drag and drop a file
   - Click "Upload File" button
   - Watch the progress bar as the file uploads directly to Azure Storage

2. **Download a File**:
   - View the list of uploaded files in the table
   - Click "Download" next to any file
   - The file will download to your browser's download folder

3. **Refresh File List**:
   - Click the "Refresh" button to reload the list of files

## API Endpoints

### POST /api/storage/upload-token
Generate a SAS token for uploading a file.

**Request Body**:
```json
{
  "fileName": "example.pdf",
  "contentType": "application/pdf"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sasToken": "sv=2021-06-08&...",
    "blobUri": "https://...",
    "containerName": "uploads",
    "blobName": "unique-id_example.pdf",
    "expiresOn": "2024-01-01T13:00:00Z"
  }
}
```

### GET /api/storage/download-token/{blobName}
Generate a SAS token for downloading a file.

**Response**:
```json
{
  "success": true,
  "data": {
    "sasToken": "sv=2021-06-08&...",
    "blobUri": "https://...",
    "containerName": "uploads",
    "blobName": "unique-id_example.pdf",
    "expiresOn": "2024-01-01T13:00:00Z"
  }
}
```

### GET /api/storage/blobs
List all blobs in the container.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "name": "unique-id_example.pdf",
      "uri": "https://...",
      "size": 102400,
      "lastModified": "2024-01-01T12:00:00Z",
      "contentType": "application/pdf"
    }
  ]
}
```

## Logging and Monitoring

### Application Insights Integration

Both the frontend and backend send telemetry to Azure Application Insights:

- **Events**: User actions (file selected, upload started, download initiated)
- **Metrics**: Upload progress, file sizes
- **Exceptions**: All errors are logged with stack traces
- **Traces**: Detailed diagnostic logging
- **Dependencies**: HTTP calls, Azure Storage operations

### View Logs

1. Go to Azure Portal > Application Insights > Your resource
2. Navigate to:
   - **Logs** for querying telemetry
   - **Failures** for exceptions
   - **Performance** for request metrics
   - **Live Metrics** for real-time monitoring

### Sample Queries

```kusto
// Failed requests in the last 24 hours
requests
| where timestamp > ago(24h)
| where success == false
| project timestamp, name, resultCode, duration

// Upload events
customEvents
| where name == "UploadCompleted"
| project timestamp, customDimensions.fileName, customDimensions.fileSize

// Exceptions
exceptions
| where timestamp > ago(24h)
| project timestamp, type, outerMessage, innermostMessage
```

## Security Considerations

1. **User Delegation SAS**: Uses Azure AD credentials for more secure token generation
2. **Limited Permissions**: SAS tokens have minimal required permissions (read/write only)
3. **Time-Limited**: Tokens expire after 1 hour
4. **CORS**: Configured to only accept requests from allowed origins
5. **Secrets Management**: Never commit `appsettings.json` or environment files with real credentials

## Production Deployment

### Backend

1. Update CORS allowed origins in `appsettings.json`
2. Use Azure Key Vault for secrets
3. Deploy to Azure App Service:

```bash
az webapp up --name myapi --resource-group MyResourceGroup --runtime "DOTNET|8.0"
```

### Frontend

1. Update `environment.prod.ts` with production API URL
2. Build for production:

```bash
npm run build
```

3. Deploy to Azure Static Web Apps or App Service

## Troubleshooting

### Common Issues

1. **SAS Token Generation Fails**:
   - Verify App Registration has correct permissions
   - Check that Storage Account role assignment is correct
   - Ensure TenantId, ClientId, and ClientSecret are correct

2. **Upload Fails**:
   - Check CORS settings on Storage Account
   - Verify blob container exists
   - Check browser console for errors

3. **Application Insights Not Logging**:
   - Verify connection string is correct
   - Check that telemetry is not disabled in browser
   - Wait a few minutes for data to appear

## Project Structure

```
.
├── api/                          # .NET Web API
│   ├── Controllers/
│   │   └── StorageController.cs
│   ├── Models/
│   │   ├── ApiResponse.cs
│   │   ├── BlobListItem.cs
│   │   ├── SasTokenRequest.cs
│   │   └── SasTokenResponse.cs
│   ├── Middleware/
│   │   └── ExceptionHandlingMiddleware.cs
│   ├── Services/
│   │   ├── IAzureStorageService.cs
│   │   └── AzureStorageService.cs
│   ├── Program.cs
│   ├── appsettings.json
│   └── AzureStorageApi.csproj
│
└── client/                       # Angular Application
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   │   ├── file-upload.component.ts
    │   │   │   ├── file-upload.component.html
    │   │   │   └── file-upload.component.css
    │   │   ├── interceptors/
    │   │   │   └── error.interceptor.ts
    │   │   ├── models/
    │   │   │   ├── api-response.model.ts
    │   │   │   └── sas-token.model.ts
    │   │   ├── services/
    │   │   │   ├── app-insights.service.ts
    │   │   │   └── azure-storage.service.ts
    │   │   ├── app.component.ts
    │   │   └── app.config.ts
    │   ├── environments/
    │   │   ├── environment.ts
    │   │   └── environment.prod.ts
    │   ├── index.html
    │   ├── main.ts
    │   └── styles.css
    ├── angular.json
    ├── package.json
    ├── tailwind.config.js
    └── tsconfig.json
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
