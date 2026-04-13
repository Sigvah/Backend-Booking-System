using FjordLine.Services;

namespace FjordLine.Endpoints;

public static class DepartureEndpoints
{
    public static RouteGroupBuilder MapDepartureEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/departures");

        group.MapGet("/", (DepartureService service) =>
            Results.Ok(service.GetAll()));

        group.MapGet("/{id:guid}/manifest", (Guid id, DepartureService service) =>
        {
            var manifest = service.GetManifest(id);
            return manifest is null
                ? Results.NotFound($"Departure {id} not found.")
                : Results.Ok(manifest);
        });

        return group;
    }
}
