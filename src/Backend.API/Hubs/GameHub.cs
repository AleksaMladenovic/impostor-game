namespace MyApp.Api.Hubs;

using System.Net.Mail;
using CommonLayer.DTOs;
using Microsoft.AspNetCore.SignalR;
using MyApp.CommonLayer.DTOs;
using MyApp.CommonLayer.Enums;
using MyApp.CommonLayer.Interfaces;
using MyApp.CommonLayer.Models;
using global::CommonLayer.DTOs;
using global::CommonLayer.Models;

public class GameHub : Hub
{
    private readonly IGameRoomRepository _gameRoomRepository;
    private readonly ILobbyService _lobbyService;

    // Hub može direktno da koristi repozitorijum jer upravlja "živim" stanjem
    public GameHub(IGameRoomRepository gameRoomRepository, ILobbyService lobbyService)
    {
        _gameRoomRepository = gameRoomRepository;
        _lobbyService = lobbyService;
    }

    public async Task JoinRoom(string roomId, string username, string userId)
    {
        var connectionId = Context.ConnectionId;
        var room = await _lobbyService.JoinRoomAsync(roomId, username, userId, connectionId);
        if (room == null)
        {
            await Clients.Caller.SendAsync("Error", $"Soba sa ID-em '{roomId}' ne postoji.");
            return;
        }
        await Groups.AddToGroupAsync(connectionId, roomId);
        await Clients.Group(roomId).SendAsync("PlayerListUpdated", room.Players.Values.ToList());
    }

    // Logika za izlazak iz sobe
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var connectionId = Context.ConnectionId;
        var userId = await _gameRoomRepository.GetUserIdForConnection(connectionId);
        if (string.IsNullOrEmpty(userId))
        {
            await base.OnDisconnectedAsync(exception);
            return;
        }
        var roomId = await _gameRoomRepository.GetRoomFromUserId(userId);
        if (string.IsNullOrEmpty(roomId))
        {
            await base.OnDisconnectedAsync(exception);
            return;
        }
        var room = await _lobbyService.RemovePlayerFromRoomAsync(roomId, userId, connectionId);
        await base.OnDisconnectedAsync(exception);
        if (room != null)
        {
            if (room.Players.Count == 0)
                return;
            await Clients.Group(roomId).SendAsync("PlayerListUpdated", room.Players.Values.ToList());
        }
    }

    public async Task LeaveRoom(string userId)
    {
        var connectionId = Context.ConnectionId;
        var room = await _lobbyService.LeaveRoomAsync(userId, connectionId);
        if (room != null && room.Players.Count > 0)
        {
            var roomId = await _gameRoomRepository.GetRoomFromUserId(userId);
            if (!string.IsNullOrEmpty(roomId))
                await Clients.Group(roomId).SendAsync("PlayerListUpdated", room.Players.Values.ToList());
        }
    }

    public async Task StartGame(string roomId, int maxNumberOfRounds, int durationPerUserInSeconds)
    {
        await _lobbyService.StartGameAsync(roomId, maxNumberOfRounds, durationPerUserInSeconds);
        var room = await _gameRoomRepository.GetByIdAsync(roomId);
        SendRoom sendRoom = new SendRoom
        {
            RoomId = room!.RoomId,
            CurrentRound = room.CurrentRound,
            CurrentTurnPlayerUsername = room.Players.ContainsKey(room.CurrentTurnPlayerId!) ? room.Players[room.CurrentTurnPlayerId!].Username : null,
            SecretWord = room.SecretWord,
            UsernameOfImpostor = room.Players.ContainsKey(room.UserIdOfImpostor!) ? room.Players[room.UserIdOfImpostor!].Username : null,
            State = room.State,
            NumberOfRounds = room.NumberOfRounds,
            SecondsPerTurn = room.SecondsPerTurn
        };
        if (room != null)
        {
            await Clients.Group(roomId).SendAsync("GameStarted", sendRoom);
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
            await _lobbyService.SendMessageToRoomAsync(roomId, messageModel);
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

            await _lobbyService.SendClueToRoomAsync(roomId, clueModel);

            await Clients.Group(roomId).SendAsync("ReceiveClue", clue);

            var updatedRoom = await _lobbyService.AdvanceTurnAsync(roomId);

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

            await _lobbyService.RegisterVoteAsync(roomId, voteModel);

            await Clients.Group(roomId).SendAsync("UserVoted", voteDto.Username);

            var updatedRoom = await _lobbyService.GetRoomAsync(roomId);

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