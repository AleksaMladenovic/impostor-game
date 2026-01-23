namespace MyApp.CommonLayer.Interfaces;

using MyApp.CommonLayer.DTOs;
using MyApp.CommonLayer.Enums;
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
    Task SetUsers(string roomId, List<string> usernames);
    Task<List<string>> GetUsers(string roomId);
    Task SetStartingSettings(string roomId, 
    int maxNumberOfRounds, 
    int durationPerUserInSeconds, 
    string firstPlayer, 
    string impostorUsername,
    string secretWord);
    Task SetNewState(string roomId, GameState newState, int durationInSeconds);
    Task<ReturnState> GetCurrentState(string roomId);
    Task<ShowSecretStates> GetShowSecretStateDetails(string roomId);
    Task UpdateCurrentPlayer(string roomId, string currentPlayer);
    Task<String> GetCurrentPlayer(string roomId);
    Task<string> GetFirstPlayer(string roomId);
    Task<int> GetCurrentRound(string roomId);
    Task<int> IncrementAndGetCurrentRound(string roomId);
    Task<int> GetMaxNumberOfRounds(string roomId); 
    Task<int> GetDurationPerUserInSeconds(string roomId);
}