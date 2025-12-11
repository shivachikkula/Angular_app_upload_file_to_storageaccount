namespace AzureStorageApi.Models;

public class BlobListItem
{
    public string Name { get; set; } = string.Empty;
    public string Uri { get; set; } = string.Empty;
    public long Size { get; set; }
    public DateTime? LastModified { get; set; }
    public string ContentType { get; set; } = string.Empty;
}
