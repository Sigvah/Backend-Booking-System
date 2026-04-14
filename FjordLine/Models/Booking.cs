namespace FjordLine.Models;

public class Booking
{
    public Guid Id { get; init; }
    public string PassengerName { get; init; }
    public int PassengerCount { get; init; }
    public VehicleType? Vehicle { get; init; }
    public string BoardingPort { get; init; }
    public string DisembarkPort { get; init; }
}

public enum VehicleType
{
    Car,
    Bike,
    Bus,
}
