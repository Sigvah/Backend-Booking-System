namespace FjordLine.Models;

public class RouteSegment
{
    public string From { get; init; } = string.Empty;
    public string To { get; init; } = string.Empty;
    public int Capacity { get; set; }
}
