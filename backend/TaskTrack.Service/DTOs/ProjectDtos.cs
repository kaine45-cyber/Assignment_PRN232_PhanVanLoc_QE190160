using System.ComponentModel.DataAnnotations;

namespace TaskTrack.Service.DTOs;

public class ProjectDto
{
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public short Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
    public int TaskCount { get; set; }
}

public class ProjectDetailDto : ProjectDto
{
    public List<TaskDto> Tasks { get; set; } = new();
}

public class ProjectRequest : IValidatableObject
{
    [Required(ErrorMessage = "Project name is required.")]
    [StringLength(200, ErrorMessage = "Project name must be at most 200 characters.")]
    public string ProjectName { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required(ErrorMessage = "Start date is required.")]
    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    [Range(0, 3, ErrorMessage = "Status must be 0 (Not Started), 1 (In Progress), 2 (Completed) or 3 (On Hold).")]
    public short Status { get; set; }

    [Required(ErrorMessage = "Department is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "Department is required.")]
    public int? DepartmentId { get; set; }

    public bool IsActive { get; set; } = true;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (StartDate.HasValue && EndDate.HasValue && EndDate.Value < StartDate.Value)
        {
            yield return new ValidationResult("End date must be on or after the start date.", new[] { nameof(EndDate) });
        }
    }
}
