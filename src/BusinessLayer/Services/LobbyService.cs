using Cassandra.Serialization;
using CommonLayer.Interfaces;
using CommonLayer.Models;
using MyApp.CommonLayer.Enums;
using MyApp.CommonLayer.Interfaces;
using MyApp.CommonLayer.Models;

namespace MyApp.BusinessLayer.Services;


public class LobbyService : ILobbyService
{
    private readonly IGameRoomRepository _gameRoomRepository;
    private readonly ISecretWordService _secretWordService;
    private readonly IUserService _userService;
    private readonly IChatRepository _chatRepository;
    private readonly IVoteRepository _voteRepository;

    private readonly IClueRepository _clueRepository;
    // Zavisimo od interfejsa, ne od konkretne Redis implementacije!
    public LobbyService(IGameRoomRepository gameRoomRepository, ISecretWordService secretWordService, IChatRepository chatRepository,IClueRepository clueRepository,IUserService user,IVoteRepository voteRepository)
    {
        _gameRoomRepository = gameRoomRepository;
        _secretWordService = secretWordService;
        _chatRepository = chatRepository;
        _clueRepository = clueRepository;
        _userService = user;
        _voteRepository = voteRepository;
    }

    public async Task<GameRoom> CreateRoomAsync()
    {
        var roomId = Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();
        var room = new GameRoom(roomId);

        await _gameRoomRepository.SaveAsync(room);

        return room;
    }
    
    

    public async Task<GameRoom?> JoinRoomAsync(string roomId, string username, string userId, string connectionId)
    {
        var room = await _gameRoomRepository.GetByIdAsync(roomId);
        if (room == null)
            return null;

        await _gameRoomRepository.RemoveTimerForRoom(roomId);
        var player = new Player(connectionId, userId, username, room.Players.Count == 0);

        if (room.Players.ContainsKey(userId))
        {
            await _gameRoomRepository.SaveUserIdForConnection(userId, connectionId);
            return room;
        }

        room.Players.Add(userId, player);
        await _gameRoomRepository.SaveRoomForUserId(userId, roomId);
        await _gameRoomRepository.SaveUserIdForConnection(userId, connectionId);
        await _gameRoomRepository.SaveAsync(room);
        return room;
    }

    public async Task<GameRoom?> LeaveRoomAsync(string userId, string connectionId)
    {
        var roomId = await _gameRoomRepository.GetRoomFromUserId(userId);
        if (string.IsNullOrEmpty(roomId))
            return null;
        return await RemovePlayerFromRoomAsync(roomId, userId, connectionId);
    }

    public async Task<GameRoom?> RemovePlayerFromRoomAsync(string roomId, string userId, string connectionId)
    {
        var room = await _gameRoomRepository.GetByIdAsync(roomId);
        if (room == null)
            return null;
        if (room.Players.ContainsKey(userId))
        {
            if (room.Players[userId].IsHost && room.Players.Count > 1)
            {
                var newHost = room.Players.Values.First(p => p.UserId != userId);
                newHost.IsHost = true;
            }
            room.Players.Remove(userId);
            await _gameRoomRepository.RemoveRoomForUserId(userId);
            await _gameRoomRepository.RemoveUserIdForConnection(connectionId);
            await _gameRoomRepository.SaveAsync(room);
            if (room.Players.Count == 0)
            {
                await _gameRoomRepository.DeleteAsync(roomId, 30);
            }
        }
        return room;
    }


}