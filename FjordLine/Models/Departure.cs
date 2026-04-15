using System.Text.Json.Serialization;

namespace FjordLine.Models;

public class Departure
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Route { get; init; } = string.Empty;
    public DateTime DepartureTime { get; init; }
    public List<RouteSegment> SegmentCapacities { get; init; } = [];
    public List<Booking> Bookings { get; } = [];

    [JsonIgnore]
    public List<string> Ports =>
        SegmentCapacities.Count == 0 ? [] :
        [SegmentCapacities[0].From, ..SegmentCapacities.Select(s => s.To)];
}