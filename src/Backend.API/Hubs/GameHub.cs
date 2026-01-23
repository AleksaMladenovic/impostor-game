using CommonLayer.DTOs;
using CommonLayer.Models;
using Microsoft.AspNetCore.SignalR;
using MyApp.CommonLayer.DTOs;
using MyApp.CommonLayer.Interfaces;
using MyApp.CommonLayer.Models;

namespace MyApp.Api.Hubs;

public class GameHub : Hub
{
    private readonly IGameRoomRepository _gameRoomRepository;
    private readonly IGameService _gameService;

    // Hub može direktno da koristi repozitorijum jer upravlja "živim" stanjem
    public GameHub(IGameRoomRepository gameRoomRepository, IGameService gameService)
    {
        _gameRoomRepository = gameRoomRepository;
        _gameService = gameService;
    }

    public async Task JoinGame(string roomId, string username, string userId)
    {
        var connectionId = Context.ConnectionId;
        // var room = await _lobbyService.JoinRoomAsync(roomId, username, userId, connectionId);
        // if (room == null)
        // {
        //     await Clients.Caller.SendAsync("Error", $"Soba sa ID-em '{roomId}' ne postoji.");
        //     return;
        // }
        await Groups.AddToGroupAsync(connectionId, roomId);
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

