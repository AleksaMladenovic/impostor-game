using MyApp.CommonLayer.Models;

namespace MyApp.CommonLayer.Interfaces;

public interface IChatRepository
{
    Task AddMessageToRoomAsync(string roomId, Message message);
    Task<List<Message>> GetMessagesFromRoomAsync(string roomId);
}