using System.Text.Json;
using TaskTrack.Service.Common;

namespace TaskTrack.API.Middleware;

/// <summary>
/// Converts service-layer exceptions into consistent JSON error responses:
/// { status, title, message, errors? } — "errors" is a field → messages map (same shape as ASP.NET validation).
/// </summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AppException ex)
        {
            await WriteAsync(context, ex.StatusCode, ex.Message, ex.Errors);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            await WriteAsync(context, StatusCodes.Status500InternalServerError, "An unexpected error occurred.", null);
        }
    }

    private static Task WriteAsync(HttpContext context, int status, string message, IDictionary<string, string[]>? errors)
    {
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/json";
        var body = new
        {
            status,
            title = status switch { 400 => "Bad Request", 404 => "Not Found", _ => "Server Error" },
            message,
            errors
        };
        return context.Response.WriteAsync(JsonSerializer.Serialize(body, new JsonSerializerOptions(JsonSerializerDefaults.Web)));
    }
}
