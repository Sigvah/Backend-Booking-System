using FjordLine.Models;
using FjordLine.Requests;

namespace FjordLine.Services;

public class DepartureService
{
    private readonly Lock _lock = new();

    private readonly List<Departure> _departures =
    [
        new Departure
        {
            Id = Guid.Parse("11111111-0000-0000-0000-000000000001"),
            Route = "Bergen → Stavanger → Hirtshals → Kristiansand",
            DepartureTime = DateTime.UtcNow.AddDays(3),
            SegmentCapacities =
            [
                new RouteSegment { From = "Bergen",    To = "Stavanger",    Capacity = 400 },
                new RouteSegment { From = "Stavanger", To = "Hirtshals",    Capacity = 350 },
                new RouteSegment { From = "Hirtshals", To = "Kristiansand", Capacity = 300 },
            ]
        },
        new Departure
        {
            Id = Guid.Parse("11111111-0000-0000-0000-000000000002"),
            Route = "Bergen → Stavanger → Hirtshals → Kristiansand",
            DepartureTime = DateTime.UtcNow.AddDays(10),
            SegmentCapacities =
            [
                new RouteSegment { From = "Bergen",    To = "Stavanger",    Capacity = 400 },
                new RouteSegment { From = "Stavanger", To = "Hirtshals",    Capacity = 350 },
                new RouteSegment { From = "Hirtshals", To = "Kristiansand", Capacity = 300 },
            ]
        }
    ];

    public IReadOnlyList<Departure> GetAll()
    {
        lock (_lock) return _departures.ToList();
    }

    private Departure? GetById(Guid id) => _departures.FirstOrDefault(d => d.Id == id);

    public (Booking? booking, BookingFailure? failure) CreateBooking(Guid departureId, CreateBookingRequest request)
    {
        if (request.PassengerCount <= 0)
            return (null, new BookingFailure(BookingError.InvalidInput, "PassengerCount must be at least 1."));

        lock (_lock)
        {
            var departure = _departures.FirstOrDefault(d => d.Id == departureId);
            if (departure is null)
                return (null, new BookingFailure(BookingError.DepartureNotFound, "Departure not found."));

            var ports = BuildPortOrder(departure.SegmentCapacities);
            var fromIdx = ports.IndexOf(request.BoardingPort);
            var toIdx = ports.IndexOf(request.DisembarkPort);

            if (fromIdx == -1)
                return (null, new BookingFailure(BookingError.InvalidInput, $"'{request.BoardingPort}' is not a port on this departure."));
            if (toIdx == -1)
                return (null, new BookingFailure(BookingError.InvalidInput, $"'{request.DisembarkPort}' is not a port on this departure."));
            if (fromIdx >= toIdx)
                return (null, new BookingFailure(BookingError.InvalidInput, "DisembarkPort must come after BoardingPort on the route."));

            var capacityFailure = CheckSegmentCapacities(departure, ports, fromIdx, toIdx, request.PassengerCount);
            if (capacityFailure is not null)
                return (null, capacityFailure);

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                PassengerName = request.PassengerName,
                PassengerCount = request.PassengerCount,
                BoardingPort = request.BoardingPort,
                DisembarkPort = request.DisembarkPort,
                Vehicle = request.Vehicle
            };

            departure.Bookings.Add(booking);
            return (booking, null);
        }
    }

    public bool CancelBooking(Guid departureId, Guid bookingId)
    {
        lock (_lock)
        {
            var departure = _departures.FirstOrDefault(d => d.Id == departureId);
            if (departure is null)
                return false;

            var booking = departure.Bookings.FirstOrDefault(b => b.Id == bookingId);
            if (booking is null)
                return false;

            departure.Bookings.Remove(booking);
            return true;
        }
    }

    public IReadOnlyList<Booking>? GetManifest(Guid departureId)
    {
        lock (_lock)
        {
            var departure = _departures.FirstOrDefault(d => d.Id == departureId);
            return departure?.Bookings.ToList();
        }
    }

    // Returns the ordered list of ports derived from the segment chain.
    public static List<string> BuildPortOrder(List<RouteSegment> segments) =>
        segments.Count == 0 ? [] : [segments[0].From, ..segments.Select(s => s.To)];

    private static BookingFailure? CheckSegmentCapacities(
        Departure departure, List<string> ports, int fromIdx, int toIdx, int passengerCount)
    {
        for (var i = fromIdx; i < toIdx; i++)
        {
            var segment = departure.SegmentCapacities.First(s => s.From == ports[i]);

            var booked = departure.Bookings
                .Where(b =>
                {
                    var bFrom = ports.IndexOf(b.BoardingPort);
                    var bTo = ports.IndexOf(b.DisembarkPort);
                    return bFrom <= i && i < bTo;
                })
                .Sum(b => b.PassengerCount);

            if (booked + passengerCount > segment.Capacity)
                return new BookingFailure(BookingError.CapacityExceeded,
                    $"Not enough capacity on segment '{segment.From} → {segment.To}'. Available: {segment.Capacity - booked}.");
        }

        return null;
    }
}
