using Azure.Identity;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using AzureStorageApi.Models;

namespace AzureStorageApi.Services;

public class AzureStorageService : IAzureStorageService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AzureStorageService> _logger;
    private readonly BlobServiceClient _blobServiceClient;
    private readonly string _containerName;

    public AzureStorageService(IConfiguration configuration, ILogger<AzureStorageService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _containerName = _configuration["AzureStorage:ContainerName"]
            ?? throw new ArgumentNullException("Container name is not configured");

        var accountName = _configuration["AzureStorage:AccountName"]
            ?? throw new ArgumentNullException("Storage account name is not configured");

        var tenantId = _configuration["AzureStorage:TenantId"];
        var clientId = _configuration["AzureStorage:ClientId"];
        var clientSecret = _configuration["AzureStorage:ClientSecret"];

        try
        {
            // Create BlobServiceClient using Azure AD credentials
            var blobUri = new Uri($"https://{accountName}.blob.core.windows.net");

            if (!string.IsNullOrEmpty(tenantId) && !string.IsNullOrEmpty(clientId) && !string.IsNullOrEmpty(clientSecret))
            {
                var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
                _blobServiceClient = new BlobServiceClient(blobUri, credential);
                _logger.LogInformation("BlobServiceClient initialized with ClientSecretCredential");
            }
            else
            {
                // Fallback to DefaultAzureCredential for local development
                _blobServiceClient = new BlobServiceClient(blobUri, new DefaultAzureCredential());
                _logger.LogInformation("BlobServiceClient initialized with DefaultAzureCredential");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize BlobServiceClient");
            throw;
        }
    }

    public async Task<SasTokenResponse> GenerateUserDelegationSasTokenAsync(string blobName, string contentType)
    {
        try
        {
            _logger.LogInformation("Generating user delegation SAS token for blob: {BlobName}", blobName);

            // Get a user delegation key
            var keyStart = DateTimeOffset.UtcNow;
            var keyExpiry = DateTimeOffset.UtcNow.AddHours(1);
            var userDelegationKey = await _blobServiceClient.GetUserDelegationKeyAsync(keyStart, keyExpiry);

            _logger.LogDebug("User delegation key obtained, valid until: {KeyExpiry}", keyExpiry);

            // Create a SAS token for the blob
            var sasBuilder = new BlobSasBuilder
            {
                BlobContainerName = _containerName,
                BlobName = blobName,
                Resource = "b", // b for blob
                StartsOn = DateTimeOffset.UtcNow.AddMinutes(-5),
                ExpiresOn = DateTimeOffset.UtcNow.AddHours(1)
            };

            // Set permissions for upload
            sasBuilder.SetPermissions(BlobSasPermissions.Read | BlobSasPermissions.Write | BlobSasPermissions.Create);

            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            var blobClient = containerClient.GetBlobClient(blobName);

            // Generate the SAS token
            var sasToken = sasBuilder.ToSasQueryParameters(userDelegationKey, _blobServiceClient.AccountName).ToString();
            var blobUri = $"{blobClient.Uri}?{sasToken}";

            _logger.LogInformation("Successfully generated SAS token for blob: {BlobName}", blobName);

            return new SasTokenResponse
            {
                SasToken = sasToken,
                BlobUri = blobUri,
                ContainerName = _containerName,
                BlobName = blobName,
                ExpiresOn = sasBuilder.ExpiresOn.DateTime
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating user delegation SAS token for blob: {BlobName}", blobName);
            throw;
        }
    }

    public async Task<SasTokenResponse> GenerateDownloadSasTokenAsync(string blobName)
    {
        try
        {
            _logger.LogInformation("Generating download SAS token for blob: {BlobName}", blobName);

            // Get a user delegation key
            var keyStart = DateTimeOffset.UtcNow;
            var keyExpiry = DateTimeOffset.UtcNow.AddHours(1);
            var userDelegationKey = await _blobServiceClient.GetUserDelegationKeyAsync(keyStart, keyExpiry);

            // Create a SAS token for the blob with read permissions
            var sasBuilder = new BlobSasBuilder
            {
                BlobContainerName = _containerName,
                BlobName = blobName,
                Resource = "b",
                StartsOn = DateTimeOffset.UtcNow.AddMinutes(-5),
                ExpiresOn = DateTimeOffset.UtcNow.AddHours(1)
            };

            sasBuilder.SetPermissions(BlobSasPermissions.Read);

            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            var blobClient = containerClient.GetBlobClient(blobName);

            var sasToken = sasBuilder.ToSasQueryParameters(userDelegationKey, _blobServiceClient.AccountName).ToString();
            var blobUri = $"{blobClient.Uri}?{sasToken}";

            _logger.LogInformation("Successfully generated download SAS token for blob: {BlobName}", blobName);

            return new SasTokenResponse
            {
                SasToken = sasToken,
                BlobUri = blobUri,
                ContainerName = _containerName,
                BlobName = blobName,
                ExpiresOn = sasBuilder.ExpiresOn.DateTime
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating download SAS token for blob: {BlobName}", blobName);
            throw;
        }
    }

    public async Task<List<BlobListItem>> ListBlobsAsync()
    {
        try
        {
            _logger.LogInformation("Listing blobs in container: {ContainerName}", _containerName);

            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            var blobs = new List<BlobListItem>();

            await foreach (var blobItem in containerClient.GetBlobsAsync())
            {
                var blobClient = containerClient.GetBlobClient(blobItem.Name);
                blobs.Add(new BlobListItem
                {
                    Name = blobItem.Name,
                    Uri = blobClient.Uri.ToString(),
                    Size = blobItem.Properties.ContentLength ?? 0,
                    LastModified = blobItem.Properties.LastModified?.DateTime,
                    ContentType = blobItem.Properties.ContentType ?? "application/octet-stream"
                });
            }

            _logger.LogInformation("Successfully listed {Count} blobs", blobs.Count);
            return blobs;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing blobs in container: {ContainerName}", _containerName);
            throw;
        }
    }
}
