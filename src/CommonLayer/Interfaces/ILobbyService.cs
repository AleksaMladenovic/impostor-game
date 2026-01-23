namespace MyApp.CommonLayer.Interfaces;

using CommonLayer.Models;
using global::CommonLayer.Models;

public interface ILobbyService
{
    Task<string> CreateRoomAsync();

    Task JoinRoomAsync(string roomId, string username, string connectionId);
    Task<string?> LeaveRoomAsync(string username);
    Task<bool> RemovePlayerFromRoomAsync(string roomId, string username);
    Task<List<string>> GetUsernamesForLobby(string roomId);
    Task<string> GetHostOfRoomAsync(string roomId);
    Task RecconectPlayerAsync(string roomId, string connectionId, string username);
    Task<bool> RoomContainsPlayerAsync(string roomId, string username);
    // Dodaj ostale metode koje će ti trebati
}