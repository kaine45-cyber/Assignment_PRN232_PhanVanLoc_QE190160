using System;
using System.Collections.Generic;

namespace TaskTrack.Repo.Models;

public partial class SystemAccount
{
    public int AccountId { get; set; }

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    /// <summary>0 = Staff, 1 = Admin</summary>
    public short Role { get; set; }

    public DateTime CreatedDate { get; set; }

    public virtual ICollection<TaskItem> CreatedTasks { get; set; } = new List<TaskItem>();

    public virtual ICollection<TaskItem> UpdatedTasks { get; set; } = new List<TaskItem>();

    public virtual ICollection<Project> CreatedProjects { get; set; } = new List<Project>();

    public virtual ICollection<Project> UpdatedProjects { get; set; } = new List<Project>();

    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
