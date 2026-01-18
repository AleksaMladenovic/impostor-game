namespace MyApp.Api.Hubs;

using Microsoft.AspNetCore.SignalR;
using MyApp.CommonLayer.Interfaces;
using MyApp.CommonLayer.Models;

public class GameHub : Hub
{
    private readonly IGameRoomRepository _gameRoomRepository;

    // Hub može direktno da koristi repozitorijum jer upravlja "živim" stanjem
    public GameHub(IGameRoomRepository gameRoomRepository)
    {
        _gameRoomRepository = gameRoomRepository;
    }

    public async Task JoinRoom(string roomId, string username, string userId)
    {
        var room = await _gameRoomRepository.GetByIdAsync(roomId);

        // Slučaj 1: Soba ne postoji
        if (room == null)
        {
            await Clients.Caller.SendAsync("Error", $"Soba sa ID-em '{roomId}' ne postoji.");
            return;
        }

        await _gameRoomRepository.RemoveTimerForRoom(roomId);
        var connectionId = Context.ConnectionId;
        var player = new Player(connectionId, userId, username);

        // Slučaj 2: Igrač je već u sobi (npr. refresh stranice)
        if (room.Players.ContainsKey(userId))
        {
            // Možemo samo da ga dodamo u grupu ponovo i pošaljemo mu trenutno stanje
            await Groups.AddToGroupAsync(connectionId, roomId);
            await _gameRoomRepository.SaveUserIdForConnection(userId, connectionId);
            await Clients.Client(connectionId).SendAsync("PlayerListUpdated", room.Players.Values.ToList());
            return;
        }

        // Slučaj 3: Novi igrač se pridružuje
        room.Players.Add(userId, player);
        
        // Čuva se mapiranje između connectionId i roomId u Redis-u
        await _gameRoomRepository.SaveRoomForUserId(userId, roomId);
        
        await _gameRoomRepository.SaveUserIdForConnection(userId, connectionId);

        // Dodaj konekciju u SignalR grupu da prima poruke za ovu sobu
        await Groups.AddToGroupAsync(connectionId, roomId);

        // Sačuvaj ažurirano stanje sobe u Redis
        await _gameRoomRepository.SaveAsync(room);

        // Obavesti SVE igrače u sobi (uključujući novog) o promeni
        await Clients.Group(roomId).SendAsync("PlayerListUpdated", room.Players.Values.ToList());
    }

    // Logika za izlazak iz sobe
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var connectionId = Context.ConnectionId;
        
        // Pronađi sobu u kojoj je bio igrač (iz Redis-a)
        var userId = await _gameRoomRepository.GetUserIdForConnection(connectionId);
        if (string.IsNullOrEmpty(userId))
        {
            // Nije pronađen userId za ovu konekciju
            await base.OnDisconnectedAsync(exception);
            return;
        }
        var roomId = await _gameRoomRepository.GetRoomFromUserId(userId);
        if (string.IsNullOrEmpty(roomId))
        {
            // Korisnik nije bio u nijednoj sobi
            await base.OnDisconnectedAsync(exception);
            return;
        }
        
        // Pronađi sobu i ukloni igrača
        await RemovePlayerFromRoomAsync(roomId, userId, connectionId);
        await base.OnDisconnectedAsync(exception);
    }

    // Pomoćna metoda koja uklanja igrača iz sobe
    private async Task RemovePlayerFromRoomAsync(string roomId, string userId, string connectionId)
    {
        var room = await _gameRoomRepository.GetByIdAsync(roomId);

        if (room == null)
            return;

        // Ukloni igrača iz liste
        if (room.Players.ContainsKey(userId))
        {
            room.Players.Remove(userId);
            // Ukloni mapiranje iz Redis-a
            await _gameRoomRepository.RemoveRoomForUserId(userId);
            await _gameRoomRepository.RemoveUserIdForConnection(connectionId);
            
            await Groups.RemoveFromGroupAsync(connectionId, roomId);
            // Ako soba nema igrače, možeš je obrisati ili je ostaviti
            if (room.Players.Count == 0)
            {
                await _gameRoomRepository.DeleteAsync(roomId, 30); // Briše se nakon 30 minuta neaktivnosti
            }
            else
            {
                // Sačuvaj ažurirano stanje sobe u Redis
                await _gameRoomRepository.SaveAsync(room);

                // Obavesti sve preostale igrače da je neko izašao
                await Clients.Group(roomId).SendAsync("PlayerListUpdated", room.Players.Values.ToList());
            }
        }
    }

    public async Task LeaveRoom(string userId)
    {
        var connectionId = Context.ConnectionId;
        var roomId = await _gameRoomRepository.GetRoomFromUserId(userId);

        if (string.IsNullOrEmpty(roomId))
            return;

        await RemovePlayerFromRoomAsync(roomId, userId, connectionId);
    }
}