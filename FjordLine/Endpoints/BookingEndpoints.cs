using FjordLine.Models;
using FjordLine.Requests;
using FjordLine.Services;

namespace FjordLine.Endpoints;

public static class BookingEndpoints
{
    public static RouteGroupBuilder MapBookingEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/departures/{departureId:guid}/bookings");

        group.MapPost("/", (Guid departureId, CreateBookingRequest request, DepartureService service) =>
        {
            var (booking, failure) = service.CreateBooking(departureId, request);
            if (failure is not null)
                return failure.Kind switch
                {
                    BookingError.DepartureNotFound => Results.NotFound(failure.Message),
                    BookingError.CapacityExceeded  => Results.Conflict(failure.Message),
                    _                              => Results.BadRequest(failure.Message)
                };

            return Results.Created($"/departures/{departureId}/bookings/{booking!.Id}", booking);
        });

        group.MapDelete("/{bookingId:guid}", (Guid departureId, Guid bookingId, DepartureService service) =>
        {
            var cancelled = service.CancelBooking(departureId, bookingId);
            return cancelled
                ? Results.NoContent()
                : Results.NotFound($"Booking {bookingId} on departure {departureId} not found.");
        });

        return group;
    }
}
