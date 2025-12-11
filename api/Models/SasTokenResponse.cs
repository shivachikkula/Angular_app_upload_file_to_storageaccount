namespace AzureStorageApi.Models;

public class SasTokenResponse
{
    public string SasToken { get; set; } = string.Empty;
    public string BlobUri { get; set; } = string.Empty;
    public string ContainerName { get; set; } = string.Empty;
    public string BlobName { get; set; } = string.Empty;
    public DateTime ExpiresOn { get; set; }
}
