
using MyApp.CommonLayer.Enums;

namespace MyApp.CommonLayer.Interfaces;

public class SendRoom
{
    public required string RoomId { get; set; }
    public int CurrentRound { get; set; } = 0;
    public string? CurrentTurnPlayerUsername { get; set; }
    public string? SecretWord { get; set; }
    public string? UsernameOfImpostor { get; set; }
    public GameState State { get; set; } = GameState.ShowSecret;
    public int NumberOfRounds { get; set; } = 5;
    public int SecondsPerTurn { get; set; } = 30;
}