using System.ComponentModel.DataAnnotations;

namespace TaskTrack.Service.DTOs;

public class TaskDto
{
    public int TaskId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public short Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public short Priority { get; set; }
    public string PriorityName { get; set; } = string.Empty;
    public DateOnly? DueDate { get; set; }
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public List<TagDto> Tags { get; set; } = new();
}

public class TaskRequest
{
    [Required(ErrorMessage = "Title is required.")]
    [StringLength(300, ErrorMessage = "Title must be at most 300 characters.")]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Range(0, 3, ErrorMessage = "Status must be 0 (To Do), 1 (In Progress), 2 (Done) or 3 (Cancelled).")]
    public short Status { get; set; }

    [Range(0, 3, ErrorMessage = "Priority must be 0 (Low), 1 (Medium), 2 (High) or 3 (Critical).")]
    public short Priority { get; set; } = 1;

    public DateOnly? DueDate { get; set; }

    [Required(ErrorMessage = "Project is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "Project is required.")]
    public int? ProjectId { get; set; }

    /// <summary>Optional list of TagIDs. On update the task's tags are replaced by this list.</summary>
    public List<int>? TagIds { get; set; }
}
