using Microsoft.AspNetCore.Mvc;
using AzureStorageApi.Models;
using AzureStorageApi.Services;

namespace AzureStorageApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StorageController : ControllerBase
{
    private readonly IAzureStorageService _storageService;
    private readonly ILogger<StorageController> _logger;

    public StorageController(IAzureStorageService storageService, ILogger<StorageController> logger)
    {
        _storageService = storageService;
        _logger = logger;
    }

    /// <summary>
    /// Generate a SAS token for uploading a file
    /// </summary>
    [HttpPost("upload-token")]
    public async Task<ActionResult<ApiResponse<SasTokenResponse>>> GetUploadToken([FromBody] SasTokenRequest request)
    {
        try
        {
            _logger.LogInformation("Received request for upload SAS token. FileName: {FileName}, ContentType: {ContentType}",
                request.FileName, request.ContentType);

            if (string.IsNullOrWhiteSpace(request.FileName))
            {
                _logger.LogWarning("Upload token request rejected: FileName is required");
                return BadRequest(ApiResponse<SasTokenResponse>.ErrorResponse("FileName is required", "INVALID_REQUEST"));
            }

            // Generate a unique blob name to avoid conflicts
            var blobName = $"{Guid.NewGuid()}_{request.FileName}";
            var sasToken = await _storageService.GenerateUserDelegationSasTokenAsync(blobName, request.ContentType);

            _logger.LogInformation("Successfully generated upload SAS token for blob: {BlobName}", blobName);

            return Ok(ApiResponse<SasTokenResponse>.SuccessResponse(sasToken, "SAS token generated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating upload SAS token for file: {FileName}", request.FileName);
            return StatusCode(500, ApiResponse<SasTokenResponse>.ErrorResponse(
                "Failed to generate SAS token", "TOKEN_GENERATION_FAILED"));
        }
    }

    /// <summary>
    /// Generate a SAS token for downloading a file
    /// </summary>
    [HttpGet("download-token/{blobName}")]
    public async Task<ActionResult<ApiResponse<SasTokenResponse>>> GetDownloadToken(string blobName)
    {
        try
        {
            _logger.LogInformation("Received request for download SAS token. BlobName: {BlobName}", blobName);

            if (string.IsNullOrWhiteSpace(blobName))
            {
                _logger.LogWarning("Download token request rejected: BlobName is required");
                return BadRequest(ApiResponse<SasTokenResponse>.ErrorResponse("BlobName is required", "INVALID_REQUEST"));
            }

            var sasToken = await _storageService.GenerateDownloadSasTokenAsync(blobName);

            _logger.LogInformation("Successfully generated download SAS token for blob: {BlobName}", blobName);

            return Ok(ApiResponse<SasTokenResponse>.SuccessResponse(sasToken, "Download SAS token generated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating download SAS token for blob: {BlobName}", blobName);
            return StatusCode(500, ApiResponse<SasTokenResponse>.ErrorResponse(
                "Failed to generate download SAS token", "TOKEN_GENERATION_FAILED"));
        }
    }

    /// <summary>
    /// List all blobs in the container
    /// </summary>
    [HttpGet("blobs")]
    public async Task<ActionResult<ApiResponse<List<BlobListItem>>>> ListBlobs()
    {
        try
        {
            _logger.LogInformation("Received request to list blobs");

            var blobs = await _storageService.ListBlobsAsync();

            _logger.LogInformation("Successfully retrieved {Count} blobs", blobs.Count);

            return Ok(ApiResponse<List<BlobListItem>>.SuccessResponse(blobs, $"Retrieved {blobs.Count} blobs"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing blobs");
            return StatusCode(500, ApiResponse<List<BlobListItem>>.ErrorResponse(
                "Failed to list blobs", "LIST_BLOBS_FAILED"));
        }
    }

    /// <summary>
    /// Health check endpoint
    /// </summary>
    [HttpGet("health")]
    public IActionResult Health()
    {
        _logger.LogInformation("Health check requested");
        return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
    }
}
