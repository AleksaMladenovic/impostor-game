namespace MyApp.CommonLayer.Interfaces;

using MyApp.CommonLayer.DTOs;
using MyApp.CommonLayer.Enums;
using MyApp.CommonLayer.Models;

public interface IGameRoomRepository
{
    Task SetUsers(string roomId, List<string> usernames);
    Task<List<string>> GetUsers(string roomId);
    Task<int> NumberOfUsers(string roomId);
    Task SetStartingSettings(string roomId, 
    int maxNumberOfRounds, 
    int durationPerUserInSeconds, 
    string firstPlayer, 
    string impostorUsername,
    string secretWord);
    Task <string> GetImpostorUsername(string roomId);
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
    Task SetEdjectedPlayer(string roomId, string? ejectedPlayer);
    Task<string?> GetEdjectedPlayer(string roomId);
    Task<List<GameHistoryEvent>> GetHistory(string roomId);
    Task DeleteAsync(string roomId);
    Task<bool> GameStarted(string roomId);
}