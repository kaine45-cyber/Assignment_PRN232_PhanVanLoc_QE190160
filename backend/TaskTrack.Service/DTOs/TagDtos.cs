using System.ComponentModel.DataAnnotations;

namespace TaskTrack.Service.DTOs;

public class TagDto
{
    public int TagId { get; set; }
    public string TagName { get; set; } = string.Empty;
    public string? Color { get; set; }
    public int TaskCount { get; set; }
}

public class TagRequest
{
    [Required(ErrorMessage = "Tag name is required.")]
    [StringLength(50, ErrorMessage = "Tag name must be at most 50 characters.")]
    public string TagName { get; set; } = string.Empty;

    [RegularExpression("^#[0-9A-Fa-f]{6}$", ErrorMessage = "Color must be a hex code like #3B82F6.")]
    public string? Color { get; set; }
}
