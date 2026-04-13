namespace FjordLine.Models;

public class Departure
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Route { get; init; } = string.Empty;
    public DateTime DepartureTime { get; init; }
    public List<RouteSegment> SegmentCapacities { get; init; } = [];
    public List<Booking> Bookings { get; } = [];
}