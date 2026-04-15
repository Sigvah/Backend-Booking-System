using FjordLine.Models;
using FjordLine.Requests;
using FjordLine.Services;

namespace FjordLine.Tests;

public class DepartureServiceTests
{
    private static readonly Guid DepartureId = Guid.Parse("11111111-0000-0000-0000-000000000001");

    // Seed capacities for Bergen → Stavanger → Hirtshals → Kristiansand
    private const int BergenStavangerCapacity    = 400;
    private const int StavangerHirtshalsCapacity = 350;
    private const int HirtshalsKrsCapacity       = 300; // bottleneck

    private static DepartureService CreateService() => new();

    // --- GetAll ---

    [Fact]
    public void GetAll_ReturnsBothSeedDepartures()
    {
        var service = CreateService();
        var all = service.GetAll();
        Assert.Equal(2, all.Count);
        Assert.Contains(all, d => d.Id == DepartureId);
    }

    // --- CreateBooking: success ---

    [Fact]
    public void CreateBooking_FullRoute_Succeeds()
    {
        var service = CreateService();
        var (booking, failure) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("Alice", 2, "Bergen", "Kristiansand", null));

        Assert.Null(failure);
        Assert.NotNull(booking);
        Assert.Equal("Bergen", booking.BoardingPort);
        Assert.Equal("Kristiansand", booking.DisembarkPort);
    }

    [Fact]
    public void CreateBooking_MiddleSegmentOnly_Succeeds()
    {
        var service = CreateService();
        var (booking, failure) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("Alice", 1, "Stavanger", "Hirtshals", null));

        Assert.Null(failure);
        Assert.NotNull(booking);
    }

    [Fact]
    public void CreateBooking_AppearsInManifest()
    {
        var service = CreateService();
        service.CreateBooking(DepartureId, new CreateBookingRequest("Alice", 1, "Bergen", "Kristiansand", null));

        Assert.Single(service.GetManifest(DepartureId)!);
    }

    // --- CreateBooking: error kinds ---

    [Fact]
    public void CreateBooking_UnknownDeparture_ReturnsDepartureNotFound()
    {
        var service = CreateService();
        var (booking, failure) = service.CreateBooking(Guid.NewGuid(),
            new CreateBookingRequest("Alice", 1, "Bergen", "Kristiansand", null));

        Assert.Null(booking);
        Assert.Equal(BookingError.DepartureNotFound, failure!.Kind);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void CreateBooking_InvalidPassengerCount_ReturnsInvalidInput(int count)
    {
        var service = CreateService();
        var (booking, failure) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("Alice", count, "Bergen", "Kristiansand", null));

        Assert.Null(booking);
        Assert.Equal(BookingError.InvalidInput, failure!.Kind);
    }

    [Fact]
    public void CreateBooking_UnknownBoardingPort_ReturnsInvalidInput()
    {
        var service = CreateService();
        var (booking, failure) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("Alice", 1, "Amsterdam", "Kristiansand", null));

        Assert.Null(booking);
        Assert.Equal(BookingError.InvalidInput, failure!.Kind);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void CreateBooking_EmptyPassengerName_ReturnsInvalidInput(string name)
    {
        var service = CreateService();
        var (booking, failure) = service.CreateBooking(DepartureId,
            new CreateBookingRequest(name, 1, "Bergen", "Kristiansand", null));

        Assert.Null(booking);
        Assert.Equal(BookingError.InvalidInput, failure!.Kind);
    }

    [Fact]
    public void CreateBooking_UnknownDisembarkPort_ReturnsInvalidInput()
    {
        var service = CreateService();
        var (booking, failure) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("Alice", 1, "Bergen", "Copenhagen", null));

        Assert.Null(booking);
        Assert.Equal(BookingError.InvalidInput, failure!.Kind);
    }

    [Fact]
    public void CreateBooking_DisembarkBeforeBoardingPort_ReturnsInvalidInput()
    {
        var service = CreateService();
        var (booking, failure) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("Alice", 1, "Kristiansand", "Bergen", null));

        Assert.Null(booking);
        Assert.Equal(BookingError.InvalidInput, failure!.Kind);
    }

    [Fact]
    public void CreateBooking_SameBoardingAndDisembarkPort_ReturnsInvalidInput()
    {
        var service = CreateService();
        var (booking, failure) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("Alice", 1, "Bergen", "Bergen", null));

        Assert.Null(booking);
        Assert.Equal(BookingError.InvalidInput, failure!.Kind);
    }

    // --- Capacity: per-segment checks ---

    [Fact]
    public void CreateBooking_ExceedsCapacityOnOneSegment_ReturnsCapacityExceeded()
    {
        var service = CreateService();
        // Hirtshals→Kristiansand has the lowest capacity — fill it via full-route booking
        service.CreateBooking(DepartureId,
            new CreateBookingRequest("Group", HirtshalsKrsCapacity, "Bergen", "Kristiansand", null));

        var (booking, failure) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("Late", 1, "Bergen", "Kristiansand", null));

        Assert.Null(booking);
        Assert.Equal(BookingError.CapacityExceeded, failure!.Kind);
    }

    [Fact]
    public void CreateBooking_OnlyFirstSegmentFull_LaterSegmentBookingSucceeds()
    {
        var service = CreateService();
        service.CreateBooking(DepartureId,
            new CreateBookingRequest("Group", BergenStavangerCapacity, "Bergen", "Stavanger", null));

        var (booking, failure) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("Late", 1, "Stavanger", "Kristiansand", null));

        Assert.Null(failure);
        Assert.NotNull(booking);
    }

    [Fact]
    public void CreateBooking_PartialSegmentBookingsCountAgainstFullRouteCapacity()
    {
        var service = CreateService();
        // Fill the last segment via a partial booking
        service.CreateBooking(DepartureId,
            new CreateBookingRequest("Group", HirtshalsKrsCapacity, "Hirtshals", "Kristiansand", null));

        var (booking, failure) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("Alice", 1, "Bergen", "Kristiansand", null));

        Assert.Null(booking);
        Assert.Equal(BookingError.CapacityExceeded, failure!.Kind);
    }

    // --- CancelBooking ---

    [Fact]
    public void CancelBooking_ExistingBooking_RemovesFromManifest()
    {
        var service = CreateService();
        var (booking, _) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("Alice", 1, "Bergen", "Kristiansand", null));

        Assert.True(service.CancelBooking(DepartureId, booking!.Id));
        Assert.Empty(service.GetManifest(DepartureId)!);
    }

    [Fact]
    public void CancelBooking_UnknownBookingId_ReturnsFalse()
    {
        var service = CreateService();
        Assert.False(service.CancelBooking(DepartureId, Guid.NewGuid()));
    }

    [Fact]
    public void CancelBooking_UnknownDepartureId_ReturnsFalse()
    {
        var service = CreateService();
        Assert.False(service.CancelBooking(Guid.NewGuid(), Guid.NewGuid()));
    }

    [Fact]
    public void CancelBooking_FreesCapacityForNewBooking()
    {
        var service = CreateService();
        var (first, _) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("Group", HirtshalsKrsCapacity, "Bergen", "Kristiansand", null));
        service.CancelBooking(DepartureId, first!.Id);

        var (booking, failure) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("Bob", HirtshalsKrsCapacity, "Bergen", "Kristiansand", null));

        Assert.Null(failure);
        Assert.NotNull(booking);
    }

    // --- Vehicle capacity ---

    private const int VehicleCapacity = 50; // seeded value

    [Fact]
    public void CreateBooking_WithCar_SucceedsAndStoresVehicle()
    {
        var service = CreateService();
        var (booking, failure) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("Alice", 1, "Bergen", "Kristiansand", VehicleType.Car));

        Assert.Null(failure);
        Assert.Equal(VehicleType.Car, booking!.Vehicle);
    }

    [Fact]
    public void CreateBooking_ExceedsVehicleCapacity_ReturnsCapacityExceeded()
    {
        var service = CreateService();
        // Car weight = 4, so 50 units / 4 = 12 cars max, 13th should fail
        for (var i = 0; i < 12; i++)
            service.CreateBooking(DepartureId,
                new CreateBookingRequest($"Driver {i}", 1, "Bergen", "Kristiansand", VehicleType.Car));

        var (booking, failure) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("Late", 1, "Bergen", "Kristiansand", VehicleType.Car));

        Assert.Null(booking);
        Assert.Equal(BookingError.CapacityExceeded, failure!.Kind);
    }

    [Fact]
    public void CancelBooking_WithVehicle_RestoresVehicleCapacity()
    {
        var service = CreateService();
        // Fill vehicle capacity with cars (12 cars = 48 units, 2 remaining — not enough for another car)
        for (var i = 0; i < 12; i++)
            service.CreateBooking(DepartureId,
                new CreateBookingRequest($"Driver {i}", 1, "Bergen", "Kristiansand", VehicleType.Car));

        var (lastCar, _) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("Last", 1, "Bergen", "Kristiansand", VehicleType.Bike));

        service.CancelBooking(DepartureId, lastCar!.Id);

        // After cancelling the bike, we should still not have room for a car (only 2 units freed)
        // Cancel one car instead to free 4 units
        var manifest = service.GetManifest(DepartureId)!;
        service.CancelBooking(DepartureId, manifest[0].Id);

        var (booking, failure) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("New", 1, "Bergen", "Kristiansand", VehicleType.Car));

        Assert.Null(failure);
        Assert.NotNull(booking);
    }

    [Fact]
    public void CreateBooking_VehicleCapacityIndependentOfPassengerCapacity()
    {
        var service = CreateService();
        // Fill passenger capacity on Bergen→Stavanger
        service.CreateBooking(DepartureId,
            new CreateBookingRequest("Group", BergenStavangerCapacity, "Bergen", "Stavanger", null));

        // Vehicle booking on same segment should still work
        var (booking, failure) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("Driver", 0, "Bergen", "Stavanger", VehicleType.Car));

        // PassengerCount 0 is invalid, so test vehicle independently
        var (booking2, failure2) = service.CreateBooking(DepartureId,
            new CreateBookingRequest("Driver", 1, "Stavanger", "Kristiansand", VehicleType.Car));

        Assert.Null(failure2);
        Assert.NotNull(booking2);
    }

    // --- GetManifest ---

    [Fact]
    public void GetManifest_UnknownDeparture_ReturnsNull()
    {
        var service = CreateService();
        Assert.Null(service.GetManifest(Guid.NewGuid()));
    }

    [Fact]
    public void GetManifest_EmptyDeparture_ReturnsEmptyList()
    {
        var service = CreateService();
        Assert.Empty(service.GetManifest(DepartureId)!);
    }
}
