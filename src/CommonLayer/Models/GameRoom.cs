using MyApp.CommonLayer.Enums;

namespace MyApp.CommonLayer.Models;

public class GameRoom
{
    public string RoomId { get; set; }

    // Rečnik igrača je idealan za brz pristup preko UserId.
    // Key: UserId, Value: Player object
    public Dictionary<string, Player> Players { get; set; } = new();

    public GameState State { get; set; } = GameState.Lobby;

    // Podešavanja igre koja je postavio host
    public int NumberOfRounds { get; set; } = 5;
    public int SecondsPerTurn { get; set; } = 30;

    // ----- Podaci o trenutnom stanju igre -----

    public int CurrentRound { get; set; } = 0;
    
    // Tajna reč za "crew" članove
    public string? SecretWord { get; set; }

    // Ko je trenutno na potezu (čuvamo ConnectionId)
    public string? CurrentTurnPlayerId { get; set; }
    
    // Ovde možemo čuvati asocijacije za trenutnu rundu
    // Key: Player ConnectionId, Value: Clue
    public Dictionary<string, string> SubmittedClues { get; set; } = new();

    // Ovde možemo čuvati glasove za trenutnu rundu
    // Key: Voter's ConnectionId, Value: Voted Player's ConnectionId
    public Dictionary<string, string> Votes { get; set; } = new();

    public GameRoom(string roomId)
    {
        RoomId = roomId;
    }
}
