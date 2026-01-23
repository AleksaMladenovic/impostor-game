// --- USING DIREKTIVE ---
// Obavezno dodaj using direktive za tvoje projekte i biblioteke
using BusinessLayer.Services;
using Cassandra;
using CommonLayer.Interfaces;
using DatabaseLayer.Repositories;
using MyApp.Api.Hubs;
using MyApp.BusinessLayer.Services;
using MyApp.CommonLayer.Interfaces;
using MyApp.DatabaseLayer.Repositories;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// --- 1. KONFIGURACIJA SERVISA (Dependency Injection) ---

// CORS Politika - AŽURIRANO: Dodato AllowCredentials() za SignalR
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Tvoja React adresa
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // KLJUČNO ZA SIGNALR!
    });
});

// BAZE (Redis & Cassandra) - Tvoja postojeća konfiguracija je odlična
builder.Services.AddSingleton<IConnectionMultiplexer>(sp => 
{
    // U produkciji, ovaj string bi bio u appsettings.json
    return ConnectionMultiplexer.Connect("localhost:6379"); 
});

builder.Services.AddSingleton<Cassandra.ISession>(sp => 
{
    var cluster = Cluster.Builder()
        .AddContactPoint("127.0.0.1") // U produkciji, ovo bi bilo u appsettings.json
        .WithPort(9042)
        .Build();

    var session = cluster.Connect();
    // Ova logika za kreiranje keyspace-a je OK za razvoj
    session.Execute(@"
        CREATE KEYSPACE IF NOT EXISTS impostor_game 
        WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};
    ");

    session.ChangeKeyspace("impostor_game");

    session.Execute(@"
        CREATE TABLE IF NOT EXISTS users (
            user_id text PRIMARY KEY,
            username text,
            email text
        );
    ");

    session.Execute(@"
        CREATE TABLE IF NOT EXISTS user_stats (
            user_id text PRIMARY KEY,
            games_played counter,
            wins_as_crewmate counter,
            wins_as_impostor counter,
            total_score counter
        );"
    );

    session.Execute(@"
        CREATE TABLE IF NOT EXISTS user_by_username (
            username text PRIMARY KEY,
            user_id text
        ); 
    ");
    session.Execute(@"
    CREATE TABLE IF NOT EXISTS secret_words (
        word_id text PRIMARY KEY,
        word text
        );"
);

    session.ChangeKeyspace("impostor_game");
    return session;
});

// NOVO: REGISTRACIJA SLOJEVA APLIKACIJE
// Ovde povezujemo interfejse sa njihovim konkretnim implementacijama.
// AddScoped je dobar izbor za životni vek ovih servisa.
builder.Services.AddScoped<IGameRoomRepository, RedisGameRoomRepository>();
builder.Services.AddScoped<ILobbyService, LobbyService>();
builder.Services.AddScoped<IUserService, CassandraUserRepository>();
builder.Services.AddScoped<ISecretWordRepository, CassandraSecretWordRepository>();
builder.Services.AddScoped<ISecretWordService, SecretWordService>();
builder.Services.AddScoped<IChatRepository, RedisChatRepository>();
builder.Services.AddScoped<IClueRepository, RedisClueRepository>();
builder.Services.AddScoped<IVoteRepository,RedisVoteRepository>();
builder.Services.AddScoped<IGameService, GameService>();
builder.Services.AddScoped<ILobbyRepository, RedisLobbyRepository>();
// Kad budeš imao repozitorijume za Cassandru, registrovaćeš ih ovde.

// NOVO: DODAVANJE SIGNALR-A
builder.Services.AddSignalR();

// KONTROLERI I SWAGGER - Bez promena
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


// --- 2. KONFIGURACIJA APLIKACIJE (Middleware Pipeline) ---

var app = builder.Build();

// Swagger UI samo u razvojnom okruženju
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// HTTPS Redirection (dobra praksa)
app.UseHttpsRedirection();

// Primeni CORS politiku - mora biti pre MapHub i MapControllers
app.UseCors("AllowSpecificOrigin");

app.UseAuthorization();

// Mapiranje endpoint-a
app.MapControllers();
app.MapHub<LobbyHub>("/lobbyhub"); 
app.MapHub<GameHub>("/gamehub");

app.Run();