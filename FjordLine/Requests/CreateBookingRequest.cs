using FjordLine.Models;

namespace FjordLine.Requests;

public record CreateBookingRequest(
    string PassengerName,
    int PassengerCount,
    string BoardingPort,
    string DisembarkPort,
    VehicleType? Vehicle
);
