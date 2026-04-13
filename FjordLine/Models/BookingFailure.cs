namespace FjordLine.Models;

public enum BookingError
{
    DepartureNotFound,
    InvalidInput,
    CapacityExceeded
}

public record BookingFailure(BookingError Kind, string Message);
