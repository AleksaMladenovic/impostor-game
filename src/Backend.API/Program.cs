using Cassandra;
using StackExchange.Redis;
// Swashbuckle namespace nije potreban gore, koristi se automatski kroz ekstenzije

var builder = WebApplication.CreateBuilder(args);

// --- 1. BAZE (Redis & Cassandra) ---
builder.Services.AddSingleton<IConnectionMultiplexer>(sp => 
{
    return ConnectionMultiplexer.Connect("localhost:6379");
});

builder.Services.AddSingleton<Cassandra.ISession>(sp => 
{
    var cluster = Cluster.Builder()
        .AddContactPoint("127.0.0.1")
        .WithPort(9042)
        .WithLoadBalancingPolicy(new DCAwareRoundRobinPolicy("datacenter1"))
        .Build();

    var session = cluster.Connect();
    session.Execute(@"
        CREATE KEYSPACE IF NOT EXISTS oglasnik 
        WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};
    ");
    session.ChangeKeyspace("oglasnik");
    return session;
});

// --- 2. SERVISI ---
builder.Services.AddControllers();

// --- 3. SWAGGER KONFIGURACIJA ---
// Ovo dodaje servise potrebne za generisanje dokumentacije
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173").AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

// --- 4. SWAGGER UI ---
// Ovo aktiviramo samo dok razvijamo aplikaciju
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(); // Ovo pravi onaj lepi plavi ekran
}

app.UseCors("ReactPolicy");
app.UseAuthorization();
app.MapControllers();

app.Run();