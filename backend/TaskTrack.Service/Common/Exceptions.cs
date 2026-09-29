namespace TaskTrack.Service.Common;

/// <summary>Base exception for expected business errors; translated to HTTP responses by the API middleware.</summary>
public abstract class AppException : Exception
{
    public int StatusCode { get; }
    public IDictionary<string, string[]>? Errors { get; }

    protected AppException(int statusCode, string message, IDictionary<string, string[]>? errors = null)
        : base(message)
    {
        StatusCode = statusCode;
        Errors = errors;
    }
}

public class NotFoundException : AppException
{
    public NotFoundException(string message) : base(404, message) { }
}

public class BadRequestException : AppException
{
    public BadRequestException(string message, IDictionary<string, string[]>? errors = null)
        : base(400, message, errors) { }

    /// <summary>Creates a 400 with a single field-level error.</summary>
    public static BadRequestException ForField(string field, string message) =>
        new(message, new Dictionary<string, string[]> { [field] = new[] { message } });
}
