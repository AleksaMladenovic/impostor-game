namespace MyApp.CommonLayer.Interfaces;
using MyApp.CommonLayer.Models;

public interface ILobbyService
{
    Task<GameRoom> CreateRoomAsync();
    Task StartGameAsync(string roomId, int maxNumberOfRounds, int durationPerUserInSeconds);
    Task<GameRoom?> JoinRoomAsync(string roomId, string username, string userId, string connectionId);
    Task<GameRoom?> LeaveRoomAsync(string userId, string connectionId);
    Task<GameRoom?> RemovePlayerFromRoomAsync(string roomId, string userId, string connectionId);
    // Dodaj ostale metode koje će ti trebati
}