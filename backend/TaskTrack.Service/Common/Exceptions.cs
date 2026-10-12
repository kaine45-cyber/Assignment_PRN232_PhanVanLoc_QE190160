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

/// <summary>409 — the request conflicts with existing data (e.g. duplicate email, account still referenced).</summary>
public class ConflictException : AppException
{
    public ConflictException(string message, IDictionary<string, string[]>? errors = null)
        : base(409, message, errors) { }

    public static ConflictException ForField(string field, string message) =>
        new(message, new Dictionary<string, string[]> { [field] = new[] { message } });
}

/// <summary>401 — invalid credentials or refresh token.</summary>
public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message) : base(401, message) { }
}

/// <summary>403 — authenticated but not allowed.</summary>
public class ForbiddenException : AppException
{
    public ForbiddenException(string message) : base(403, message) { }
}
