namespace MyApp.CommonLayer.Models;

/// <summary>
/// Jedan zapis u istoriji igre (message/clue/vote) kako se čuva u Redis-u.
/// </summary>
public class GameHistoryEvent
{
    /// <summary>
    /// Tip događaja: "message", "clue", "vote".
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Korisničko ime aktera (za message/clue).
    /// </summary>
    public string? Username { get; set; }

    /// <summary>
    /// Sadržaj poruke ili clue-a.
    /// </summary>
    public string? Content { get; set; }

    /// <summary>
    /// Glasanje: ko glasa.
    /// </summary>
    public string? Voter { get; set; }

    /// <summary>
    /// Glasanje: za koga je glas.
    /// </summary>
    public string? Target { get; set; }

    /// <summary>
    /// Vreme događaja (UTC).
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Broj runde (0 ako nije primenljivo, npr. poruke).
    /// </summary>
    public int Round { get; set; } = 0;
}
