using FjordLine.Models;
using FjordLine.Requests;

namespace FjordLine.Services;

public class DepartureService
{
    private readonly Lock _lock = new();

    private static readonly Dictionary<VehicleType, int> VehicleWeights = new()
    {
        { VehicleType.Bike,  1 },
        { VehicleType.Car,   4 },
        { VehicleType.Bus,  15 },
    };

    private readonly List<Departure> _departures =
    [
        new Departure
        {
            Id = Guid.Parse("11111111-0000-0000-0000-000000000001"),
            Route = "Bergen → Stavanger → Hirtshals → Kristiansand",
            DepartureTime = DateTime.UtcNow.AddDays(3),
            Segments =
            [
                new RouteSegment { From = "Bergen",    To = "Stavanger",    PassengerCapacity = 400, VehicleCapacity = 50 },
                new RouteSegment { From = "Stavanger", To = "Hirtshals",    PassengerCapacity = 350, VehicleCapacity = 50 },
                new RouteSegment { From = "Hirtshals", To = "Kristiansand", PassengerCapacity = 300, VehicleCapacity = 50 },
            ]
        },
        new Departure
        {
            Id = Guid.Parse("11111111-0000-0000-0000-000000000002"),
            Route = "Bergen → Stavanger → Hirtshals → Kristiansand",
            DepartureTime = DateTime.UtcNow.AddDays(10),
            Segments =
            [
                new RouteSegment { From = "Bergen",    To = "Stavanger",    PassengerCapacity = 400, VehicleCapacity = 50 },
                new RouteSegment { From = "Stavanger", To = "Hirtshals",    PassengerCapacity = 350, VehicleCapacity = 50 },
                new RouteSegment { From = "Hirtshals", To = "Kristiansand", PassengerCapacity = 300, VehicleCapacity = 50 },
            ]
        }
    ];

    public IReadOnlyList<Departure> GetAll()
    {
        lock (_lock) return _departures.ToList();
    }

    public (Booking? booking, BookingFailure? failure) CreateBooking(Guid departureId, CreateBookingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PassengerName))
            return (null, new BookingFailure(BookingError.InvalidInput, "PassengerName is required."));
        if (request.PassengerCount <= 0)
            return (null, new BookingFailure(BookingError.InvalidInput, "PassengerCount must be at least 1."));

        lock (_lock)
        {
            var departure = _departures.FirstOrDefault(d => d.Id == departureId);
            if (departure is null)
                return (null, new BookingFailure(BookingError.DepartureNotFound, "Departure not found."));

            var ports = departure.Ports;
            var fromIdx = ports.IndexOf(request.BoardingPort);
            var toIdx = ports.IndexOf(request.DisembarkPort);

            if (fromIdx == -1)
                return (null, new BookingFailure(BookingError.InvalidInput, $"'{request.BoardingPort}' is not a port on this departure."));
            if (toIdx == -1)
                return (null, new BookingFailure(BookingError.InvalidInput, $"'{request.DisembarkPort}' is not a port on this departure."));
            if (fromIdx >= toIdx)
                return (null, new BookingFailure(BookingError.InvalidInput, "DisembarkPort must come after BoardingPort on the route."));

            var capacityFailure = CheckSegmentCapacities(departure, fromIdx, toIdx, request.PassengerCount, request.Vehicle);
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
            AdjustCapacity(departure, fromIdx, toIdx, -request.PassengerCount, request.Vehicle);
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

            var fromIdx = departure.Ports.IndexOf(booking.BoardingPort);
            var toIdx = departure.Ports.IndexOf(booking.DisembarkPort);

            departure.Bookings.Remove(booking);
            AdjustCapacity(departure, fromIdx, toIdx, booking.PassengerCount, booking.Vehicle);
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

    private static BookingFailure? CheckSegmentCapacities(
        Departure departure, int fromIdx, int toIdx, int passengerCount, VehicleType? vehicle)
    {
        var vehicleWeight = vehicle is not null ? VehicleWeights[vehicle.Value] : 0;

        for (var i = fromIdx; i < toIdx; i++)
        {
            var segment = departure.Segments[i];
            if (segment.PassengerCapacity < passengerCount)
                return new BookingFailure(BookingError.CapacityExceeded,
                    $"Not enough passenger capacity on '{segment.From} → {segment.To}'. Available: {segment.PassengerCapacity}.");
            if (vehicleWeight > 0 && segment.VehicleCapacity < vehicleWeight)
                return new BookingFailure(BookingError.CapacityExceeded,
                    $"Not enough vehicle capacity on '{segment.From} → {segment.To}'. Available: {segment.VehicleCapacity} units.");
        }

        return null;
    }

    private static void AdjustCapacity(Departure departure, int fromIdx, int toIdx, int passengerDelta, VehicleType? vehicle)
    {
        var vehicleWeight = vehicle is not null ? VehicleWeights[vehicle.Value] : 0;
        for (var i = fromIdx; i < toIdx; i++)
        {
            departure.Segments[i].PassengerCapacity += passengerDelta;
            if (vehicleWeight > 0)
                departure.Segments[i].VehicleCapacity += passengerDelta > 0 ? vehicleWeight : -vehicleWeight;
        }
    }
}
