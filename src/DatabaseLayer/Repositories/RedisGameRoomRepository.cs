using MyApp.CommonLayer.DTOs;
using MyApp.CommonLayer.Enums;
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

    public async Task SetUsers(string roomId, List<string> usernames)
    {
        var key = $"game:room:{roomId}:users";
        var values = usernames.Select(u => (RedisValue)u).ToArray();
        await _redisDb.SetAddAsync(key, values);
    }

    
    public async Task SetStartingSettings(string roomId, int maxNumberOfRounds, int durationPerUserInSeconds, string firstPlayer, string impostorUsername, string secretWord)
    {
        var settingsKey = $"game:room:{roomId}:settings";
        var currentRoundKey = $"game:room:{roomId}:currentRound";
        await _redisDb.StringSetAsync(currentRoundKey, 1);
        var settings = new HashEntry[]
        {
            new HashEntry("MaxNumberOfRounds", maxNumberOfRounds),
            new HashEntry("DurationPerUserInSeconds", durationPerUserInSeconds),
            new HashEntry("FirstPlayer", firstPlayer),
            new HashEntry("CurrentPlayer", firstPlayer),
            new HashEntry("ImpostorUsername", impostorUsername),
            new HashEntry("SecretWord", secretWord)
        };
        await _redisDb.HashSetAsync(settingsKey, settings);
    }

    public async Task SetNewState(string roomId, GameState newState, int durationInSeconds)
    {
        var stateKey = $"game:room:{roomId}:state";
        var nextState = new HashEntry[]
        {
            new HashEntry("State", (int)newState),
            new HashEntry("StateDurationInSeconds", durationInSeconds),
            new HashEntry("StateStartTime", DateTimeOffset.UtcNow.ToUnixTimeSeconds())
        };
        await _redisDb.HashSetAsync(stateKey, nextState);
    }

    public async Task<ReturnState> GetCurrentState(string roomId)
    {
        var stateKey = $"game:room:{roomId}:state";
        var fields = new RedisValue[] { "State", "StateDurationInSeconds", "StateStartTime" };
        var values = await _redisDb.HashGetAsync(stateKey, fields);
        
        if (values[0].IsNull)
            throw new Exception("State not found for room");

        return new ReturnState
        {
            State = (GameState)(int)values[0],
            TimeStateEnd = (int)values[1] + (int)values[2]
        };
    }
    
    public async Task<ShowSecretStates> GetShowSecretStateDetails(string roomId)
    {
        var settingsKey = $"game:room:{roomId}:settings";
        var secretWord = await _redisDb.HashGetAsync(settingsKey, "SecretWord");
        var impostorUsername = await _redisDb.HashGetAsync(settingsKey, "ImpostorUsername");
        var usernames = await GetUsers(roomId);
        return new ShowSecretStates
        {
            SecretWord = secretWord.ToString() ?? "",
            ImpostorName = impostorUsername.ToString() ?? "",
            Players = usernames
        };
    }

    public async Task<String> GetCurrentPlayer(string roomId)
    {
        var settingsKey = $"game:room:{roomId}:settings";
        var currentPlayer = await _redisDb.HashGetAsync(settingsKey, "CurrentPlayer");
        return currentPlayer.ToString() ?? "";
    }

    public async Task UpdateCurrentPlayer(string roomId, string currentPlayer)
    {
        var settingsKey = $"game:room:{roomId}:settings";
        await _redisDb.HashSetAsync(settingsKey, "CurrentPlayer", currentPlayer);
    }

    public async Task<List<string>> GetUsers(string roomId)
    {
        var key = $"game:room:{roomId}:users";
        var users = await _redisDb.SetMembersAsync(key);
        return users.Select(u => u.ToString()).ToList();
    }

    public async Task<string> GetFirstPlayer(string roomId)
    {
        var settingsKey = $"game:room:{roomId}:settings";
        var firstPlayer = await _redisDb.HashGetAsync(settingsKey, "FirstPlayer");
        return firstPlayer.ToString() ?? "";
    }

    public Task<int> GetCurrentRound(string roomId)
    {
        string currentRoundKey = $"game:room:{roomId}:currentRound";
        return _redisDb.StringGetAsync(currentRoundKey).ContinueWith(t => (int)t.Result);
    }

    public Task<int> IncrementAndGetCurrentRound(string roomId)
    {
        string currentRoundKey = $"game:room:{roomId}:currentRound";
        return _redisDb.StringIncrementAsync(currentRoundKey).ContinueWith(t => (int)t.Result);
    }

    public Task<int> GetMaxNumberOfRounds(string roomId)
    {
        var settingsKey = $"game:room:{roomId}:settings";
        return _redisDb.HashGetAsync(settingsKey, "MaxNumberOfRounds").ContinueWith(t => (int)t.Result);
    }

    public Task<int> GetDurationPerUserInSeconds(string roomId)
    {
        var settingsKey = $"game:room:{roomId}:settings";
        return _redisDb.HashGetAsync(settingsKey, "DurationPerUserInSeconds").ContinueWith(t => (int)t.Result);
    }
}