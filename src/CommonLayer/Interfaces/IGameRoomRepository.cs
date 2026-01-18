namespace MyApp.CommonLayer.Interfaces;
using MyApp.CommonLayer.Models;

public interface IGameRoomRepository
{
    Task<GameRoom?> GetByIdAsync(string roomId);
    Task SaveAsync(GameRoom room);
    Task DeleteAsync(string roomId);
    
    // Mapiranje userId -> roomId (čuva se u Redis-u)
    Task SaveRoomForUserId(string userId, string roomId);
    // Dohvata roomId na osnovu userId
    Task<string?> GetRoomFromUserId(string userId);
    Task RemoveRoomForUserId(string userId);
    Task SaveUserIdForConnection(string connectionId, string userId);
    Task<string?> GetUserIdForConnection(string connectionId);
    Task RemoveUserIdForConnection(string connectionId);
    Task DeleteAsync(string roomId, int minutes);
    Task RemoveTimerForRoom(string roomId);
}