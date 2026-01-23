using MyApp.CommonLayer.Interfaces;
using MyApp.CommonLayer.Models;
using StackExchange.Redis;

namespace MyApp.DatabaseLayer.Repositories;

public class RedisLobbyRepository : ILobbyRepository
{
    private readonly IDatabase _redisDb;

    public RedisLobbyRepository(IConnectionMultiplexer redis)
    {
        _redisDb = redis.GetDatabase();
    }

    public async Task AddPlayerToRoomAsync(string roomId, string username, string connectionId)
    {
        var playersKey = $"lobby:players:{roomId}";
        var connKey = $"lobby:conn:{roomId}";
        var playerLobby = $"player:lobby:{username}";

        // proveri da li je igrač već u sobi (po username-u)
        var alreadyInRoom = await _redisDb.SortedSetScoreAsync(playersKey, username) != null;
        await _redisDb.HashSetAsync(connKey, username, connectionId);
        if (alreadyInRoom)
            return;

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        await _redisDb.SortedSetAddAsync(playersKey, username, timestamp);
        var oldLobby = await _redisDb.StringGetAsync(playerLobby);
        if (!oldLobby.IsNullOrEmpty)
        {
            await RemovePlayerFromRoomAsync(oldLobby, username);
        }
        await _redisDb.StringSetAsync(playerLobby, roomId);
    }
    public Task<List<string>> GetUsernames(string roomId)
    {
        var list = new List<string>();
        var playersKey = $"lobby:players:{roomId}";
        list.AddRange(_redisDb.SortedSetRangeByRank(playersKey).Select(x => x.ToString()));
        return Task.FromResult(list);
    }

    public Task RecconectPlayerAsync(string roomId, string connectionId, string username)
    {
        var connKey = $"lobby:conn:{roomId}";
        return _redisDb.HashSetAsync(connKey, username, connectionId);
    }

    public async Task<bool> RemovePlayerFromRoomAsync(string roomId, string username)
    {
        var playersKey = $"lobby:players:{roomId}";
        var connKey = $"lobby:conn:{roomId}";
        var playerLobby = $"player:lobby:{username}";
        var lobbyId = await _redisDb.StringGetAsync(playerLobby);
        if (lobbyId.IsNull || lobbyId.ToString() != roomId)
            return false;
        await _redisDb.SortedSetRemoveAsync(playersKey, username);
        await _redisDb.HashDeleteAsync(connKey, username);
        await _redisDb.KeyDeleteAsync(playerLobby);
        if(await _redisDb.SortedSetLengthAsync(playersKey) == 0)
        {
            await RemoveLobbyAsync(roomId);
        }
        return true;
    }

    // public Task RemoveTimerForRoom(string roomId)
    // {
    //     var playersKey = $"lobby:players:{roomId}";
    //     return _redisDb.KeyDeleteAsync($"lobby:timer:{roomId}");
    // }

    public async Task<bool> RoomContainsPlayerAsync(string roomId, string username)
    {
        var playerLobby = $"player:lobby:{username}";
        var lobbyId = await _redisDb.StringGetAsync(playerLobby);
        return !lobbyId.IsNull && lobbyId.ToString() == roomId;
    }

    public Task SaveAsync(string roomId)
    {
        return _redisDb.StringSetAsync($"lobby:exists:{roomId}", "1");
    }

    public Task<string> HostOfRoomAsync(string roomId)
    {
        var playersKey = $"lobby:players:{roomId}";
        return Task.FromResult(_redisDb.SortedSetRangeByRank(playersKey, 0, 0).FirstOrDefault().ToString() ?? "");
    }

    public Task RemoveLobbyAsync(string roomId)
    {
        var playersKey = $"lobby:players:{roomId}";
        var connKey = $"lobby:conn:{roomId}";
        var players = _redisDb.SortedSetRangeByRank(playersKey);
        var deletes = new List<Task>();
        foreach (var player in players)
        {
            var playerLobby = $"player:lobby:{player}";
            deletes.Add(_redisDb.KeyDeleteAsync(playerLobby));
        }
        deletes.Add(_redisDb.KeyDeleteAsync(playersKey));
        deletes.Add(_redisDb.KeyDeleteAsync(connKey));
        deletes.Add(_redisDb.KeyDeleteAsync($"lobby:exists:{roomId}"));
        deletes.Add(_redisDb.KeyDeleteAsync($"lobby:timer:{roomId}"));
        return Task.WhenAll(deletes);
    }

    public Task<bool> DoesLobbyExistAsync(string roomId)
    {
        return _redisDb.KeyExistsAsync($"lobby:exists:{roomId}");
    }
    
    public async Task<string?> RemovePlayerFromRoomAsync(string username)
    {
        var playerLobby = $"player:lobby:{username}";
        var roomId = await _redisDb.StringGetAsync(playerLobby);
        if (roomId.IsNullOrEmpty)
            return null;
        if( await RemovePlayerFromRoomAsync(roomId!, username))
            return roomId;
        return null;
    }
}