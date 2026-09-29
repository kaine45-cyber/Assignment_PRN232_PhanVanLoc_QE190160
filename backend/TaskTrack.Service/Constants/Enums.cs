namespace TaskTrack.Service.Constants;

public enum ProjectStatus : short
{
    NotStarted = 0,
    InProgress = 1,
    Completed = 2,
    OnHold = 3
}

public enum TaskItemStatus : short
{
    ToDo = 0,
    InProgress = 1,
    Done = 2,
    Cancelled = 3
}

public enum TaskItemPriority : short
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

public static class Labels
{
    public static string ProjectStatus(short value) => value switch
    {
        0 => "Not Started",
        1 => "In Progress",
        2 => "Completed",
        3 => "On Hold",
        _ => "Unknown"
    };

    public static string TaskStatus(short value) => value switch
    {
        0 => "To Do",
        1 => "In Progress",
        2 => "Done",
        3 => "Cancelled",
        _ => "Unknown"
    };

    public static string TaskPriority(short value) => value switch
    {
        0 => "Low",
        1 => "Medium",
        2 => "High",
        3 => "Critical",
        _ => "Unknown"
    };
}
