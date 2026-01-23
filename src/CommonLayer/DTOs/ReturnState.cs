using MyApp.CommonLayer.Enums;

namespace MyApp.CommonLayer.DTOs;

public class ReturnState
{
    public GameState State { get; set; }
    public long TimeStateEnd { get; set; } // Unix timestamp in seconds
    public ShowSecretStates? ShowSecretStates { get; set; }
    public InProgressStates? InProgressStates { get; set; }
    public VotingStates? VotingStates { get; set; }
    public GameFinishedStates? GameFinishedStates { get; set; }
}

public class ShowSecretStates
{
    public required string SecretWord { get; set; }
    public required string ImpostorName { get; set; }
    public required List<string> Players { get; set; }
}

public class InProgressStates
{
    public required string CurrentPlayer { get; set; }
    public int RoundNumber { get; set; }
    public int MaxRounds { get; set; }
}

public class VotingStates
{
    
}

public class GameFinishedStates
{
    public bool ImpostorWon { get; set; }
}