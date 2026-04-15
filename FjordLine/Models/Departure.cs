using System.Text.Json.Serialization;

namespace FjordLine.Models;

public class Departure
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Route { get; init; } = string.Empty;
    public DateTime DepartureTime { get; init; }
    public List<RouteSegment> Segments { get; init; } = [];
    [JsonIgnore]
    public List<Booking> Bookings { get; } = [];

    [JsonIgnore]
    public List<string> Ports =>
        Segments.Count == 0 ? [] :
        [Segments[0].From, ..Segments.Select(s => s.To)];
}