using System;

namespace TaskTrack.Repo.Models;

public partial class RefreshToken
{
    public int RefreshTokenId { get; set; }

    public int AccountId { get; set; }

    /// <summary>SHA-256 (hex) of the refresh token — the raw token is never stored.</summary>
    public string TokenHash { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? RevokedAt { get; set; }

    public string? ReplacedByHash { get; set; }

    public virtual SystemAccount Account { get; set; } = null!;
}
