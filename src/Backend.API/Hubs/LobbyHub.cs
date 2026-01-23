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
using MyApp.BusinessLayer.Services;
using StackExchange.Redis;

public class LobbyHub : Hub
{
    private readonly IGameRoomRepository _gameRoomRepository;
    private readonly ILobbyService _lobbyService;
    private readonly IGameService _gameService;
    private readonly IDatabase _redisDb;

    // Hub može direktno da koristi repozitorijum jer upravlja "živim" stanjem
    public LobbyHub(IGameRoomRepository gameRoomRepository, ILobbyService lobbyService, IGameService gameService, IConnectionMultiplexer redis)
    {
        _redisDb = redis.GetDatabase();
        _gameRoomRepository = gameRoomRepository;
        _lobbyService = lobbyService;
        _gameService = gameService;
    }

    public async Task JoinRoom(string roomId, string username)
    {
        var connectionId = Context.ConnectionId;

        // Otkaži pending leave ako postoji
        var pendingLeaveKey = $"pending:leave:{username}";
        string? pendingLeaveRoomId = await _redisDb.StringGetAsync(pendingLeaveKey);
        if (pendingLeaveRoomId == roomId)
        {
            await _redisDb.KeyDeleteAsync(pendingLeaveKey);
            await Groups.AddToGroupAsync(connectionId, roomId);
            await _lobbyService.RecconectPlayerAsync(roomId, connectionId, username);
            await Clients.Client(connectionId).SendAsync("PlayerListUpdated", await _lobbyService.GetUsernamesForLobby(roomId));
            return;
        }
        await LeaveRoom(username);

        try
        {
            await _lobbyService.JoinRoomAsync(roomId, username, connectionId);
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("Error", ex.Message);
            return;
        }
        await Groups.AddToGroupAsync(connectionId, roomId);
        var list = await _lobbyService.GetUsernamesForLobby(roomId);
        await Clients.Group(roomId).SendAsync("PlayerListUpdated", list);
    }

    // Logika za izlazak iz sobe
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // var connectionId = Context.ConnectionId;
        // await _lobbyService.LeaveRoomAsync
    }

    public async Task LeaveRoom(string username)
    {
        var connectionId = Context.ConnectionId;
        var roomid = await _lobbyService.LeaveRoomAsync(username);
        if (roomid != null)
        {
            await Groups.RemoveFromGroupAsync(connectionId, roomid);
            await Clients.Group(roomid).SendAsync("PlayerListUpdated", await _lobbyService.GetUsernamesForLobby(roomid));
        }
    }

    public async Task LeaveRoomWithDelay(string username, string roomId, int delayInSeconds)
    {
        if(await _lobbyService.RoomContainsPlayerAsync(roomId, username) == false)
        {
            return;
        }
        var pendingLeaveKey = $"pending:leave:{username}";
        var connectionId = Context.ConnectionId;
        await _redisDb.StringSetAsync(pendingLeaveKey, roomId);
        await Task.Delay(TimeSpan.FromSeconds(delayInSeconds));

        // Ako flag još postoji, znači da se nije re-join-ovao
        if (await _redisDb.KeyDeleteAsync(pendingLeaveKey))
        {
            await _lobbyService.LeaveRoomAsync(username);
            await Groups.RemoveFromGroupAsync(connectionId, roomId);
            await Clients.Group(roomId).SendAsync("PlayerListUpdated", await _lobbyService.GetUsernamesForLobby(roomId));
        }
    }

    public async Task StartGame(string roomId, int maxNumberOfRounds, int durationPerUserInSeconds)
    {
        await _gameService.StartGameAsync(roomId, maxNumberOfRounds, durationPerUserInSeconds, await _lobbyService.GetUsernamesForLobby(roomId));
        await Clients.Group(roomId).SendAsync("GameStarted");
    }
}