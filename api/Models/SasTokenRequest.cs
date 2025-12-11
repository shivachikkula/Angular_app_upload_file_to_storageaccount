namespace AzureStorageApi.Models;

public class SasTokenRequest
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
}
