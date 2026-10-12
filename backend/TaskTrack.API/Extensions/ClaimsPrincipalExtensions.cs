using System.Security.Claims;
using TaskTrack.API.Security;

namespace TaskTrack.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    /// <summary>AccountID of the authenticated user, or null for anonymous requests.</summary>
    public static int? GetAccountId(this ClaimsPrincipal user)
    {
        var value = user.FindFirst(AppClaims.AccountId)?.Value;
        return int.TryParse(value, out var id) ? id : null;
    }

    public static int RequireAccountId(this ClaimsPrincipal user) =>
        user.GetAccountId() ?? throw new InvalidOperationException("Authenticated user has no accountId claim.");
}
