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
    

    public Task AddMessageToRoomAsync(string roomId, CommonLayer.Models.Message message)
    {
        try
        {
            _redisDb.ListRightPushAsync($"chat:{roomId}", System.Text.Json.JsonSerializer.Serialize(message));
            return Task.CompletedTask;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error serializing message: {ex.Message}");
            throw;
        }
    }


    public Task<List<CommonLayer.Models.Message>> GetMessagesFromRoomAsync(string roomId)
    {
        try
        {
            var messagesRedis = _redisDb.ListRange($"chat:{roomId}");
            var messages = messagesRedis
                .Select(msg => System.Text.Json.JsonSerializer.Deserialize<CommonLayer.Models.Message>(msg))
                .Where(msg => msg != null)
                .ToList();
            return Task.FromResult(messages) as Task<List<CommonLayer.Models.Message>>;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deserializing messages: {ex.Message}");
            throw;
        }
    }
}