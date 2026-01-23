namespace MyApp.CommonLayer.Interfaces;

using CommonLayer.Models;
using global::CommonLayer.Models;

public interface ILobbyService
{
    Task<GameRoom> CreateRoomAsync();

    Task<GameRoom?> JoinRoomAsync(string roomId, string username, string userId, string connectionId);
    Task<GameRoom?> LeaveRoomAsync(string userId, string connectionId);
    Task<GameRoom?> RemovePlayerFromRoomAsync(string roomId, string userId, string connectionId);
    // Dodaj ostale metode koje će ti trebati
}