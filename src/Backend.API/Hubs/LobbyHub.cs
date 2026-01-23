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

public class LobbyHub : Hub
{
    private readonly IGameRoomRepository _gameRoomRepository;
    private readonly ILobbyService _lobbyService;
    private readonly IGameService _gameService;

    // Hub može direktno da koristi repozitorijum jer upravlja "živim" stanjem
    public LobbyHub(IGameRoomRepository gameRoomRepository, ILobbyService lobbyService, IGameService gameService)
    {
        _gameRoomRepository = gameRoomRepository;
        _lobbyService = lobbyService;
        _gameService = gameService;
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
            var roomId = room.RoomId;
            if (!string.IsNullOrEmpty(roomId))
                await Clients.Group(roomId).SendAsync("PlayerListUpdated", room.Players.Values.ToList());
        }
    }

    public async Task StartGame(string roomId, int maxNumberOfRounds, int durationPerUserInSeconds)
    {
        await _gameService.StartGameAsync(roomId, maxNumberOfRounds, durationPerUserInSeconds);
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
}