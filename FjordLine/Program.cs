using FjordLine.Endpoints;
using FjordLine.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddSingleton<DepartureService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseHttpsRedirection();

app.MapDepartureEndpoints();
app.MapBookingEndpoints();

app.Run();
