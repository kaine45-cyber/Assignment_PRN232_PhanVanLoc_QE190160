using System.Security.Cryptography;
using System.Text;

namespace TaskTrack.Service.Security;

public static class RefreshTokenGenerator
{
    /// <summary>64 random bytes, base64url encoded (opaque to the client).</summary>
    public static string NewToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    /// <summary>SHA-256 hex digest — only this value is stored in the database.</summary>
    public static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
}
