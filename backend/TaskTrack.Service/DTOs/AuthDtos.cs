using System.ComponentModel.DataAnnotations;

namespace TaskTrack.Service.DTOs;

public class AccountDto
{
    public int AccountId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    /// <summary>0 = Staff, 1 = Admin</summary>
    public short Role { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
    /// <summary>Number of tasks created by this account (accounts with tasks cannot be deleted).</summary>
    public int CreatedTaskCount { get; set; }
}

public class RegisterRequest
{
    [Required(ErrorMessage = "Full name is required.")]
    [StringLength(100, ErrorMessage = "Full name must be at most 100 characters.")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Email is not valid.")]
    [StringLength(150, ErrorMessage = "Email must be at most 150 characters.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be 8-100 characters.")]
    public string Password { get; set; } = string.Empty;
}

public class LoginRequest
{
    [Required(ErrorMessage = "Email is required.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    public string Password { get; set; } = string.Empty;
}

public class RefreshRequest
{
    [Required(ErrorMessage = "Refresh token is required.")]
    public string RefreshToken { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string TokenType { get; set; } = "Bearer";
    public string AccessToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime RefreshTokenExpiresAt { get; set; }
    public AccountDto User { get; set; } = new();
}

public class UpdateProfileRequest
{
    [Required(ErrorMessage = "Full name is required.")]
    [StringLength(100, ErrorMessage = "Full name must be at most 100 characters.")]
    public string FullName { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    [Required(ErrorMessage = "Current password is required.")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "New password is required.")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "New password must be 8-100 characters.")]
    public string NewPassword { get; set; } = string.Empty;
}

public class UpdateAccountRequest
{
    [Required(ErrorMessage = "Full name is required.")]
    [StringLength(100, ErrorMessage = "Full name must be at most 100 characters.")]
    public string FullName { get; set; } = string.Empty;

    [Range(0, 1, ErrorMessage = "Role must be 0 (Staff) or 1 (Admin).")]
    public short Role { get; set; }
}

/// <summary>Result of issuing an access token (JWT).</summary>
public record AccessToken(string Token, DateTime ExpiresAt);
