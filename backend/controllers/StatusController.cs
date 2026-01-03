using Microsoft.AspNetCore.Mvc;
using Cassandra;
using StackExchange.Redis;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatusController : ControllerBase
{
    private readonly Cassandra.ISession _cassandraSession;
    private readonly IDatabase _redisDb;

    // Dependency Injection ubacuje konekcije koje smo napravili u Program.cs
    public StatusController(Cassandra.ISession cassandraSession, IConnectionMultiplexer redis)
    {
        _cassandraSession = cassandraSession;
        _redisDb = redis.GetDatabase();
    }

    [HttpGet]
    public async Task<IActionResult> CheckSystem()
    {
        try
        {
            // 1. Testiraj Redis (Upis i Čitanje)
            await _redisDb.StringSetAsync("pozdrav_iz_dotneta", "Redis radi kao sat!");
            var redisValue = await _redisDb.StringGetAsync("pozdrav_iz_dotneta");

            // 2. Testiraj Cassandru (Upit nad sistemskom tabelom)
            var rowSet = await _cassandraSession.ExecuteAsync(new SimpleStatement("SELECT release_version FROM system.local"));
            var cassandraVersion = rowSet.First().GetValue<string>("release_version");

            return Ok(new 
            { 
                Status = "Online", 
                RedisMessage = redisValue.ToString(),
                CassandraVersion = cassandraVersion
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Status = "Error", Message = ex.Message });
        }
    }
}