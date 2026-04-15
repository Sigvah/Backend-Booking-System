using System.Text.Json.Serialization;
using FjordLine.Endpoints;
using FjordLine.Services;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.ConfigureHttpJsonOptions(o =>
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddSingleton<DepartureService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.MapDepartureEndpoints();
app.MapBookingEndpoints();

app.Run();
