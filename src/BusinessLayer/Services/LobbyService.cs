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
    private readonly ILobbyRepository _lobbyRepository;
    // Zavisimo od interfejsa, ne od konkretne Redis implementacije!
    public LobbyService(IGameRoomRepository gameRoomRepository,  ILobbyRepository lobbyRepository)
    {
        _gameRoomRepository = gameRoomRepository;
        _lobbyRepository = lobbyRepository;
    }

    public async Task<string> CreateRoomAsync()
    {
        var roomId = Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();

        await _lobbyRepository.SaveAsync(roomId);
        return  roomId;
    }
    
    

    public async Task JoinRoomAsync(string roomId, string username, string connectionId)
    {
        if(await _lobbyRepository.DoesLobbyExistAsync(roomId) == false)
        {
            throw new Exception($"Soba sa ID-em '{roomId}' ne postoji.");
        }

        if(await _lobbyRepository.RoomContainsPlayerAsync(roomId, username))
        {
            await _lobbyRepository.RecconectPlayerAsync(roomId, connectionId, username);
        }
        else
        {
            await _lobbyRepository.AddPlayerToRoomAsync(roomId, username, connectionId);
        }
    }

    public async Task<string?> LeaveRoomAsync(string username)
    {
        return await _lobbyRepository.RemovePlayerFromRoomAsync(username);
    }

    public async Task<bool> RemovePlayerFromRoomAsync(string roomId, string username)
    {
        return await _lobbyRepository.RemovePlayerFromRoomAsync(roomId, username);
    }

    public async Task<List<string>> GetUsernamesForLobby(string roomId)
    {
        return await _lobbyRepository.GetUsernames(roomId);
    }

    public async Task<string> GetHostOfRoomAsync(string roomId)
    {
        return await _lobbyRepository.HostOfRoomAsync(roomId);
    }

    public async Task RecconectPlayerAsync(string roomId, string connectionId, string username)
    {
        await _lobbyRepository.RecconectPlayerAsync(roomId, connectionId, username);
    }

    public async Task<bool> RoomContainsPlayerAsync(string roomId, string username)
    {
        return await _lobbyRepository.RoomContainsPlayerAsync(roomId, username);
    }
}