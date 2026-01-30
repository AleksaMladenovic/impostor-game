using System.ComponentModel.DataAnnotations;
using MyApp.CommonLayer.DTOs;
using MyApp.CommonLayer.Models;

namespace MyApp.CommonLayer.Interfaces;

public interface IHistoryRepository
{
    Task<List<OdigranaPartijaZaVracanje>> GetHistoryForUserAsync(string username, int count, int offset);
    Task SaveGameAsync(List<string> players, string roomId, List<GameHistoryEvent> historyData);
    Task<(OdigranaPartijaZaVracanje, DateTime?)> GetNextAnyStateAsync(string idPartije, DateTime? poslednjeVremeKojeIma);
    Task<(OdigranaPartijaZaVracanje, DateTime?)> GetNextSignificantStateAsync(string idPartije, DateTime? poslednjeVremeKojeIma);

}