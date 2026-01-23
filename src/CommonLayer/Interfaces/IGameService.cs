using CommonLayer.Models;
using MyApp.CommonLayer.Models;

namespace MyApp.CommonLayer.Interfaces;

public interface IGameService
{
    Task<GameRoom>? GetRoomAsync(string roomId);
    Task StartGameAsync(string roomId, int maxNumberOfRounds, int durationPerUserInSeconds);
    Task SendMessageToRoomAsync(string roomId, Message message);
    Task<List<Message>> GetMessagesFromRoomAsync(string roomId);

    Task SendClueToRoomAsync(string roomId, Clue clue);
    Task<List<Clue>> GetCluesFromRoomAsync(string roomId);
    Task<GameRoom?> AdvanceTurnAsync(string roomId);

    Task RegisterVoteAsync(string roomId, Vote vote);
}