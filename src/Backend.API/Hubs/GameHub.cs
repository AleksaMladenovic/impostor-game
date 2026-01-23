using CommonLayer.DTOs;
using CommonLayer.Models;
using Microsoft.AspNetCore.SignalR;
using MyApp.CommonLayer.DTOs;
using MyApp.CommonLayer.Enums;
using MyApp.CommonLayer.Interfaces;
using MyApp.CommonLayer.Models;
using StackExchange.Redis;

namespace MyApp.Api.Hubs;

public class GameHub : Hub
{
    private readonly IGameRoomRepository _gameRoomRepository;
    private readonly IGameService _gameService;
    private readonly IDatabase _redisDb;

    // Hub može direktno da koristi repozitorijum jer upravlja "živim" stanjem
    public GameHub(IGameRoomRepository gameRoomRepository, IGameService gameService, IConnectionMultiplexer redis)
    {
        _gameRoomRepository = gameRoomRepository;
        _gameService = gameService;
        _redisDb = redis.GetDatabase();
    }
    public async Task JoinGame(string roomId)
    {
        var connectionId = Context.ConnectionId;
        await Groups.AddToGroupAsync(connectionId, roomId);
        ReturnState state = await _gameService.GetStateAsync(roomId);
        await Clients.Caller.SendAsync("GameState", state, 0);
        _redisDb.StringSet($"gamestatenum:{roomId}", (0).ToString());
        
    }
    public async Task StateEnded(string roomId, int endedStateNum)
    {
        var lockKey = $"lock:gamestate:{roomId}";
        var lockValue = Guid.NewGuid().ToString();

        // Pokušaj da uzmeš distributed lock za ovu sobu (ekspira za 5s da izbegnemo deadlock)
        if (!await _redisDb.LockTakeAsync(lockKey, lockValue, TimeSpan.FromSeconds(5)))
            return;

        try
        {
            // Re-read unutar lock-a da izbegnemo TOCTOU
            var currentStateNumVal = await _redisDb.StringGetAsync($"gamestatenum:{roomId}");
            var hasValue = !currentStateNumVal.IsNullOrEmpty;
            var currentStateNum = hasValue ? (int)currentStateNumVal : 0;

            if (currentStateNum == endedStateNum)
            {
                await _redisDb.StringIncrementAsync($"gamestatenum:{roomId}");
                await _gameService.SetNextStateAsync(roomId);
                var updatedState = await _gameService.GetStateAsync(roomId);
                await Clients.Group(roomId).SendAsync("GameState", updatedState, currentStateNum + 1);
            }
        }
        finally
        {
            await _redisDb.LockReleaseAsync(lockKey, lockValue);
        }
    }
    public async Task SendMessageToRoom(string roomId, SendMessageDto message)
    {
        try
        {
            var messageModel = new Message
            {
                UserId = message.UserId,
                Username = message.Username,
                Content = message.Content,
                Timestamp = DateTime.UtcNow
            };
            await _gameService.SendMessageToRoomAsync(roomId, messageModel);
            await Clients.Group(roomId).SendAsync("ReceiveMessage", message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error sending message to room: {ex.Message}");
            throw;
        }
    }

    public async Task SendClueToRoom(string roomId, SendClueDto clue)
    {
        try
        {
            var clueModel = new Clue
            {
                UserId = clue.UserId,
                Username = clue.Username,
                ClueWord = clue.ClueWord,
                TimeStamp = DateTime.UtcNow
            };

            await _gameService.SendClueToRoomAsync(roomId, clueModel);

            await Clients.Group(roomId).SendAsync("ReceiveClue", clue);

            var updatedRoom = await _gameService.AdvanceTurnAsync(roomId);
            if (updatedRoom != null)
            {
                await Clients.Group(roomId).SendAsync("RoomUpdated", updatedRoom);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"HUB ERROR: {ex.Message}");
            throw;
        }
    }


    public async Task VoteForPlayer(string roomId, VoteDto voteDto)
    {
        try
        {
            var voteModel = new Vote
            {
                UserId = voteDto.UserId,
                Username = voteDto.Username,
                TargetId = voteDto.TargetId ?? "skip",
                TargetUsername = voteDto.TargetUsername ?? "Preskočeno"
            };

            await _gameService.RegisterVoteAsync(roomId, voteModel);

            await Clients.Group(roomId).SendAsync("UserVoted", voteDto.Username);

            var updatedRoom = await _gameService.GetRoomAsync(roomId);
            if (updatedRoom != null)
            {
                await Clients.Group(roomId).SendAsync("RoomUpdated", updatedRoom);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"HUB VOTE ERROR: {ex.Message}");
            throw;
        }
    }
    
}

