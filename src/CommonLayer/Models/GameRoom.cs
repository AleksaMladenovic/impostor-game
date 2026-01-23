using MyApp.CommonLayer.Enums;

namespace MyApp.CommonLayer.Models;

public class GameRoom
{
    public string RoomId { get; set; }

    // Rečnik igrača je idealan za brz pristup preko UserId.
    // Key: UserId, Value: Player object
    public Dictionary<string, Player> Players { get; set; } = new();

    public GameState State { get; set; } = GameState.ShowSecret;

    // Podešavanja igre koja je postavio host
    public int NumberOfRounds { get; set; } = 5;
    public int SecondsPerTurn { get; set; } = 30;

    // ----- Podaci o trenutnom stanju igre -----

    public int CurrentRound { get; set; } = 0;
    
    // Tajna reč za "crew" članove
    public string? SecretWord { get; set; }

    // Ko je trenutno na potezu (čuvamo UserId)
    public string? CurrentTurnPlayerId { get; set; }

    public string? CurrentTurnPlayerUsername {  get; set; }
    public int TurnsTakenInCurrentRound { get; set; } = 0;

    // Ko je "impostor" u ovoj rundi (čuvamo UserId)
    public string? UserIdOfImpostor { get; set; }
    public string? UsernameOfImpostor { get; set; }

    public string? LastEjectedUserId { get; set; }
    public string? LastEjectedUsername { get; set; }
    public bool IsGameOver { get; set; } = false; // Da znamo da li je Impostor izbačen
    // Ovde možemo čuvati asocijacije za trenutnu rundu
    // Key: Player UserId, Value: Clue
    public Dictionary<string, string> SubmittedClues { get; set; } = new();

    // Ovde možemo čuvati glasove za trenutnu rundu
    // Key: Voter's UserId, Value: Voted Player's UserId
    public Dictionary<string, string> Votes { get; set; } = new();

    public GameRoom(string roomId)
    {
        RoomId = roomId;
    }
}
