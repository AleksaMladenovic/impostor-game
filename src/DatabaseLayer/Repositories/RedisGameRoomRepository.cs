using MyApp.CommonLayer.Interfaces;
using MyApp.CommonLayer.Models;
using StackExchange.Redis;
using System.Text.Json;

namespace MyApp.DatabaseLayer.Repositories;


public class RedisGameRoomRepository : IGameRoomRepository
{
    private readonly IDatabase _redisDb;

    public RedisGameRoomRepository(IConnectionMultiplexer redis)
    {
        _redisDb = redis.GetDatabase();
    }

    public async Task<GameRoom?> GetByIdAsync(string roomId)
    {
        var roomJson = await _redisDb.StringGetAsync($"room:{roomId}");
        return roomJson.IsNullOrEmpty ? null : JsonSerializer.Deserialize<GameRoom>(roomJson!);
    }

    public async Task SaveAsync(GameRoom room)
    {
        var roomJson = JsonSerializer.Serialize(room);
        await _redisDb.StringSetAsync($"room:{room.RoomId}", roomJson);
    }
    
    public async Task DeleteAsync(string roomId)
    {
        await _redisDb.KeyDeleteAsync($"room:{roomId}");
    }
    
    public async Task SaveRoomForUserId(string userId, string roomId)
    {
        // Čuva mapiranje userId -> roomId sa TTL od 24h 
        // (u slučaju da se klijent diskonektor bez upozorenja)
        await _redisDb.StringSetAsync($"conn:{userId}", roomId, TimeSpan.FromHours(24));
    }
    
    public async Task<string?> GetRoomFromUserId(string userId)
    {
        var roomId = await _redisDb.StringGetAsync($"conn:{userId}");
        return roomId.IsNull ? null : roomId.ToString();
    }
    
    public async Task RemoveRoomForUserId(string userId)
    {
        await _redisDb.KeyDeleteAsync($"conn:{userId}");
    }

    public async Task SaveUserIdForConnection(string connectionId, string userId)
    {
        await _redisDb.StringSetAsync($"connuser:{connectionId}", userId); 
    }

    public async Task<string?> GetUserIdForConnection(string connectionId)
    {
        var userId = await _redisDb.StringGetAsync($"connuser:{connectionId}");
        return userId.IsNull ? null : userId.ToString();
    }

    public async Task RemoveUserIdForConnection(string connectionId)
    {
        await _redisDb.KeyDeleteAsync($"connuser:{connectionId}");
    }

    public async Task DeleteAsync(string roomId, int minutes)
    {
        await _redisDb.KeyExpireAsync($"room:{roomId}", TimeSpan.FromMinutes(minutes));
    }

    public async Task RemoveTimerForRoom(string roomId)
    {
        await _redisDb.KeyPersistAsync($"room:{roomId}");
    }
}