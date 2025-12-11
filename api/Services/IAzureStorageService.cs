using AzureStorageApi.Models;

namespace AzureStorageApi.Services;

public interface IAzureStorageService
{
    Task<SasTokenResponse> GenerateUserDelegationSasTokenAsync(string blobName, string contentType);
    Task<SasTokenResponse> GenerateDownloadSasTokenAsync(string blobName);
    Task<List<BlobListItem>> ListBlobsAsync();
}
