using System.Reflection.Metadata;
using MyApp.CommonLayer.Models;

namespace MyApp.CommonLayer.Interfaces;

public interface ILobbyRepository
{
    Task AddPlayerToRoomAsync(string roomId, string username, string connectionId);
    Task<List<string>> GetUsernames(string roomId);
    Task RecconectPlayerAsync(string roomId, string connectionId, string username);
    Task<bool> RemovePlayerFromRoomAsync(string roomId, string username);
    Task<bool> RoomContainsPlayerAsync(string roomId, string username);
    Task SaveAsync(string roomId);
    Task<string> HostOfRoomAsync(string roomId);
    Task RemoveLobbyAsync(string roomId);
    Task<bool> DoesLobbyExistAsync(string roomId);
    Task<string?> RemovePlayerFromRoomAsync(string username);
}