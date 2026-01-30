using MyApp.CommonLayer.Models;

namespace MyApp.CommonLayer.DTOs;

public class OdigranaPartijaZaVracanje
{
    public required string Id { get; set; }
    public required string RoomId { get; set; }
    public int BrojRundi { get; set; }
    public List<string> Igraci { get; set; } = new List<string>();
    // Ključ: broj runde, vrednost: mapa (korisnik -> clue)
    public Dictionary<int, Dictionary<string, string>> CluoviPoRundi { get; set; } = new();
    public Dictionary<int, Dictionary<string, string>> GlasanjaPoRundi { get; set; } = new();
    public List<Message> Poruke { get; set; } = new List<Message>();
    public DateTime VremeKraja { get; set; } = DateTime.UtcNow;
}