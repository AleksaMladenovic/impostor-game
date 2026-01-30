using MyApp.CommonLayer.Interfaces;
using StackExchange.Redis;

namespace MyApp.DatabaseLayer.Repositories;

public class RedisChatRepository : IChatRepository
{
    private readonly IDatabase _redisDb;

    public RedisChatRepository(IConnectionMultiplexer redis)
    {
        _redisDb = redis.GetDatabase();
    }
    

    public async Task AddMessageToRoomAsync(string roomId, CommonLayer.Models.Message message)
    {
        try
        {
            await _redisDb.ListRightPushAsync($"chat:{roomId}", System.Text.Json.JsonSerializer.Serialize(message));
            await _redisDb.ListRightPushAsync(
                $"game:{roomId}:history",
                System.Text.Json.JsonSerializer.Serialize(new {
                    type = "message",
                    username = message.Username,
                    content = message.Content,
                    round = 0,
                    timestamp = DateTime.UtcNow
                })
            );
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error serializing message: {ex.Message}");
            throw;
        }
    }


    public async Task<List<CommonLayer.Models.Message>> GetMessagesFromRoomAsync(string roomId)
    {
        try
        {
            var messagesRedis = await _redisDb.ListRangeAsync($"chat:{roomId}");
            var messages = messagesRedis
                .Select(msg => System.Text.Json.JsonSerializer.Deserialize<CommonLayer.Models.Message>(msg))
                .Where(msg => msg != null)
                .ToList();
            return messages;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deserializing messages: {ex.Message}");
            throw;
        }
    }
}