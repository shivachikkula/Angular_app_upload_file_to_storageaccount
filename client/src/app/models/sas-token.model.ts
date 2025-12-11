export interface SasTokenRequest {
  fileName: string;
  contentType: string;
}

export interface SasTokenResponse {
  sasToken: string;
  blobUri: string;
  containerName: string;
  blobName: string;
  expiresOn: Date;
}

export interface BlobListItem {
  name: string;
  uri: string;
  size: number;
  lastModified?: Date;
  contentType: string;
}
