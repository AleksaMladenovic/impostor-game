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

    public async Task<int> NumberOfUsers(string roomId)
    {
        var key = $"game:room:{roomId}:users";
        return (int)await _redisDb.SetLengthAsync(key);
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

    public Task SetEdjectedPlayer(string roomId, string? ejectedPlayer)
    {
        var settingsKey = $"game:room:{roomId}:settings";
        return _redisDb.HashSetAsync(settingsKey, "EjectedPlayer", ejectedPlayer ?? "");
    }

    public Task<string?> GetEdjectedPlayer(string roomId)
    {
        var settingsKey = $"game:room:{roomId}:settings";
        return _redisDb.HashGetAsync(settingsKey, "EjectedPlayer").ContinueWith(t =>
        {
            var result = t.Result;
            return result.IsNullOrEmpty ? null : result.ToString();
        });
    }

    public Task<string> GetImpostorUsername(string roomId)
    {
        var settingsKey = $"game:room:{roomId}:settings";
        return _redisDb.HashGetAsync(settingsKey, "ImpostorUsername").ContinueWith(t => t.Result.ToString() ?? "");
    }

    public async Task<List<GameHistoryEvent>> GetHistory(string roomId)
    {
        var history = await _redisDb.ListRangeAsync($"game:{roomId}:history", 0, -1);
        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
        // Deserialize each entry to GameHistoryEvent
        return history
            .Select(h => JsonSerializer.Deserialize<GameHistoryEvent>(h.ToString(), jsonOptions))
            .Where(e => e != null)
            .ToList()!;
    }

    public async Task DeleteAsync(string roomId)
    {
        var deletes = new List<Task>
        {
            _redisDb.KeyDeleteAsync($"game:room:{roomId}:users"),
            _redisDb.KeyDeleteAsync($"game:room:{roomId}:settings"),
            _redisDb.KeyDeleteAsync($"game:room:{roomId}:state"),
            _redisDb.KeyDeleteAsync($"game:room:{roomId}:currentRound"),
            _redisDb.KeyDeleteAsync($"game:{roomId}:history"),
            _redisDb.KeyDeleteAsync($"chat:{roomId}"),
            _redisDb.KeyDeleteAsync($"clues:{roomId}")
        };

        string maxRoundKey = $"votemaxround:{roomId}";
        var maxRoundRedis = await _redisDb.StringGetAsync(maxRoundKey);
        int maxRound = maxRoundRedis.IsNullOrEmpty ? 0 : (int)maxRoundRedis;
        for (int round = 1; round <= maxRound; round++)
        {
            deletes.Add(_redisDb.KeyDeleteAsync($"votes:{roomId}:{round}"));
        }
        deletes.Add(_redisDb.KeyDeleteAsync(maxRoundKey));

        await Task.WhenAll(deletes);
    }

    public async Task<bool> GameStarted(string roomId)
    {
        // Provera settings key jer se postavlja pri početku igre i ne briše dok igra traje
        var settingsKey = $"game:room:{roomId}:settings";
        return await _redisDb.KeyExistsAsync(settingsKey);
    }
}