namespace MyApp.DatabaseLayer.Repositories;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cassandra;
using MyApp.CommonLayer.DTOs;
using MyApp.CommonLayer.Interfaces;
using MyApp.CommonLayer.Models;
using Newtonsoft.Json;

/// <summary>
/// Cassandra implementacija za čuvanje i pretragu istorije igara
/// </summary>
public class CassandraHistoryRepository : IHistoryRepository
{
    private readonly ISession _session;
    private PreparedStatement? _insertGameHistoryStatement;
    private PreparedStatement? _insertGameEventStatement;
    private PreparedStatement? _insertSignificantGameEventStatement;
    private PreparedStatement? _insertGameHistoryByUserStatement;
    private PreparedStatement? _getGameHistoriesByUserStatement;
    private PreparedStatement? _getNextEventStatement;
    private PreparedStatement? _getNextEventsStatement;
    private PreparedStatement? _getEventsFromTimeStatement;
    private PreparedStatement? _getNextSignificantEventStatement;
    private PreparedStatement? _getGameHistoryStatement;

    public CassandraHistoryRepository(ISession session)
    {
        _session = session;
        InitializePreparedStatements();
    }

    private void InitializePreparedStatements()
    {
        _insertGameHistoryStatement = _session.Prepare(
            "INSERT INTO game_history (game_id, room_id, players, end_time, created_at) VALUES (?, ?, ?, ?, ?)"
        );

        _insertGameEventStatement = _session.Prepare(
            @"INSERT INTO game_events (game_id, event_time, event_type, event_round, username, voter, target, content) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );

        _insertSignificantGameEventStatement = _session.Prepare(
            @"INSERT INTO game_significant_events (game_id, event_time, event_type, event_round, username, voter, target, content) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );

        _insertGameHistoryByUserStatement = _session.Prepare(
            "INSERT INTO game_history_by_user (username, end_time, game_id, room_id) VALUES (?, ?, ?, ?)"
        );

        _getGameHistoriesByUserStatement = _session.Prepare(
            "SELECT game_id, end_time, room_id FROM game_history_by_user WHERE username = ? LIMIT ?"
        );

        _getNextEventStatement = _session.Prepare(
            "SELECT * FROM game_events WHERE game_id = ? AND event_time > ? LIMIT 1"
        );

        _getNextEventsStatement = _session.Prepare(
            "SELECT * FROM game_events WHERE game_id = ? AND event_time >= ? LIMIT ?"
        );

        _getNextSignificantEventStatement = _session.Prepare(
            "SELECT * FROM game_significant_events WHERE game_id = ? AND event_time >= ? LIMIT 1"
        );

        _getEventsFromTimeStatement = _session.Prepare(
            "SELECT * FROM game_events WHERE game_id = ? AND event_time >= ? AND event_time <= ?"
        );

        _getGameHistoryStatement = _session.Prepare(
            "SELECT players, room_id, end_time FROM game_history WHERE game_id = ?"
        );
    }

    /// <summary>
    /// Čuva kompletnu igru sa svim događajima u Cassandra
    /// </summary>
    public async Task SaveGameAsync(List<string> players, string roomId, List<GameHistoryEvent> historyData)
    {
        try
        {
            var gameId = Guid.NewGuid();
            var now = DateTime.UtcNow;

            // Čuva osnovnu info o igri
            var gameHistoryBound = _insertGameHistoryStatement!.Bind(
                gameId,
                roomId,
                JsonConvert.SerializeObject(players),
                now,
                now
            );
            await _session.ExecuteAsync(gameHistoryBound);

            // Čuva sve događaje
            foreach (var evt in historyData)
            {
                var eventBound = _insertGameEventStatement!.Bind(
                    gameId,
                    evt.Timestamp,
                    evt.Type,
                    evt.Round,
                    evt.Username ?? "",
                    evt.Voter ?? "",
                    evt.Target ?? "",
                    evt.Content ?? ""
                );
                await _session.ExecuteAsync(eventBound);

                if (evt.Type == "clue" || evt.Type == "vote")
                {
                    var significantBound = _insertSignificantGameEventStatement!.Bind(
                        gameId,
                        evt.Timestamp,
                        evt.Type,
                        evt.Round,
                        evt.Username ?? "",
                        evt.Voter ?? "",
                        evt.Target ?? "",
                        evt.Content ?? ""
                    );
                    await _session.ExecuteAsync(significantBound);
                }
            }

            // Dodaj igru u tabelu za brzu pretragu po korisniku
            foreach (var player in players)
            {
                var userHistoryBound = _insertGameHistoryByUserStatement!.Bind(
                    player,
                    now,
                    gameId,
                    roomId
                );
                await _session.ExecuteAsync(userHistoryBound);
            }

            Console.WriteLine($"Game history saved: {gameId}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error saving game history: {ex.Message}");
            throw;
        }
    }

    /// <summary>
    /// Vraća sve igre korisnika sa paginacijom
    /// </summary>
    public async Task<List<OdigranaPartijaZaVracanje>> GetHistoryForUserAsync(string username, int count, int offset)
    {
        try
        {
            // Cassandra ne podržava offset direktno, pa povlačimo count+offset i preskačemo u memoriji.
            var bound = _getGameHistoriesByUserStatement!.Bind(username, count + offset);
            var rowSet = await _session.ExecuteAsync(bound);

            var results = new List<OdigranaPartijaZaVracanje>();
            var rows = rowSet.Skip(offset).Take(count).ToList();

            foreach (var row in rows)
            {
                var gameId = row.GetValue<Guid>("game_id");
                var game = await ReconstructGameAsync(gameId);
                if (game != null)
                    results.Add(game);
            }

            return results;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting game history for user: {ex.Message}");
            throw;
        }
    }

    /// <summary>
    /// Vraća JEDAN sledeći događaj i vreme sledećeg događaja koji nije primljen
    /// </summary>
    public async Task<(OdigranaPartijaZaVracanje, DateTime?)> GetNextAnyStateAsync(string gameId, DateTime? lastTimestamp)
    {
        try
        {
            var guid = Guid.Parse(gameId);
            var startTime = lastTimestamp ?? DateTime.MinValue;

            // Dobij prva dva događaja nakon startTime (1 za vraćanje, 1 za nextTime)
            var bound = _getNextEventsStatement!.Bind(guid, startTime, 2);
            var rowSet = await _session.ExecuteAsync(bound);
            var events = rowSet.ToList();

            if (events.Count == 0)
                return (new OdigranaPartijaZaVracanje { Id = gameId, RoomId = "" }, null);

            DateTime? returnTime = events.Count > 1
                ? events[1].GetValue<DateTimeOffset>("event_time").DateTime
                : null;

            // Rekonstruiši igru sa samo prvim događajem
            var game = BuildGameFromEventRows(guid, new[] { events[0] });
            
            return (game, returnTime);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting next any state: {ex.Message}");
            throw;
        }
    }

    /// <summary>
    /// Vraća SVE događaje do PRVOG BITNOG (clue ili vote) i vreme sledećeg događaja nakon tog bitnog
    /// </summary>
    public async Task<(OdigranaPartijaZaVracanje, DateTime?)> GetNextSignificantStateAsync(string gameId, DateTime? lastTimestamp)
    {
        try
        {
            var guid = Guid.Parse(gameId);
            var startTime = lastTimestamp ?? DateTime.MinValue;
            // Prvo nađi sledeći bitan događaj (clue/vote) iz posebne tabele
            var significantBound = _getNextSignificantEventStatement!.Bind(guid, startTime);
            var significantRowSet = await _session.ExecuteAsync(significantBound);
            var significantEvent = significantRowSet.FirstOrDefault();

            if (significantEvent == null)
                return (new OdigranaPartijaZaVracanje { Id = gameId, RoomId = "" }, null);

            var significantTime = significantEvent.GetValue<DateTimeOffset>("event_time").DateTime;

            // Sledeći događaj nakon bitnog za nextTime
            var nextBound = _getNextEventStatement!.Bind(guid, significantTime);
            var nextRowSet = await _session.ExecuteAsync(nextBound);
            var nextEvent = nextRowSet.FirstOrDefault();
            DateTime? returnTime = nextEvent?.GetValue<DateTimeOffset>("event_time").DateTime;

            // Vrati sve događaje do i uključujući bitni
            var game = await ReconstructGameWithEventsAsync(guid, startTime, significantTime);
            return (game, returnTime);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting next significant state: {ex.Message}");
            throw;
        }
    }

    private OdigranaPartijaZaVracanje BuildGameFromEventRows(Guid gameId, IEnumerable<Row> rows)
    {
        var game = new OdigranaPartijaZaVracanje
        {
            Id = gameId.ToString(),
            RoomId = gameId.ToString(),
            CluoviPoRundi = new Dictionary<int, Dictionary<string, string>>(),
            GlasanjaPoRundi = new Dictionary<int, Dictionary<string, string>>(),
            Poruke = new List<Message>()
        };

        foreach (var row in rows)
        {
            var eventType = row.GetValue<string>("event_type");
            var username = row.GetValue<string>("username");
            var eventTime = row.GetValue<DateTimeOffset>("event_time").DateTime;
            var eventRound = row.GetValue<int?>("event_round") ?? 0;
            if (eventRound <= 0) eventRound = 1;

            switch (eventType)
            {
                case "message":
                    var content = row.GetValue<string>("content");
                    game.Poruke.Add(new Message
                    {
                        Username = username,
                        Content = content,
                        Timestamp = eventTime
                    });
                    break;

                case "clue":
                    var clueContent = row.GetValue<string>("content");
                    if (!game.CluoviPoRundi.ContainsKey(eventRound))
                        game.CluoviPoRundi[eventRound] = new Dictionary<string, string>();
                    game.CluoviPoRundi[eventRound][username] = clueContent;
                    break;

                case "vote":
                    var target = row.GetValue<string>("target");
                    var voter = row.GetValue<string>("voter");
                    if (!game.GlasanjaPoRundi.ContainsKey(eventRound))
                        game.GlasanjaPoRundi[eventRound] = new Dictionary<string, string>();
                    game.GlasanjaPoRundi[eventRound][voter] = target;
                    break;
            }
        }

        return game;
    }

    /// <summary>
    /// Rekonstruiše igru sa svim događajima između dva vremena
    /// </summary>
    private async Task<OdigranaPartijaZaVracanje> ReconstructGameWithEventsAsync(Guid gameId, DateTime startTime, DateTime endTime)
    {
        var bound = _getEventsFromTimeStatement!.Bind(gameId, startTime, endTime);
        var rowSet = await _session.ExecuteAsync(bound);

        var game = new OdigranaPartijaZaVracanje
        {
            Id = gameId.ToString(),
            RoomId = gameId.ToString(),
            CluoviPoRundi = new Dictionary<int, Dictionary<string, string>>(),
            GlasanjaPoRundi = new Dictionary<int, Dictionary<string, string>>(),
            Poruke = new List<Message>()
        };

        foreach (var row in rowSet)
        {
            var eventType = row.GetValue<string>("event_type");
            var username = row.GetValue<string>("username");
            var eventTime = row.GetValue<DateTimeOffset>("event_time").DateTime;
            var eventRound = row.GetValue<int?>("event_round") ?? 0;
            if (eventRound <= 0) eventRound = 1;

            switch (eventType)
            {
                case "message":
                    var content = row.GetValue<string>("content");
                    game.Poruke.Add(new Message
                    {
                        Username = username,
                        Content = content,
                        Timestamp = eventTime
                    });
                    break;

                case "clue":
                    var clueContent = row.GetValue<string>("content");
                    if (!game.CluoviPoRundi.ContainsKey(eventRound))
                        game.CluoviPoRundi[eventRound] = new Dictionary<string, string>();
                    game.CluoviPoRundi[eventRound][username] = clueContent;
                    break;

                case "vote":
                    var target = row.GetValue<string>("target");
                    var voter = row.GetValue<string>("voter");
                    if (!game.GlasanjaPoRundi.ContainsKey(eventRound))
                        game.GlasanjaPoRundi[eventRound] = new Dictionary<string, string>();
                    game.GlasanjaPoRundi[eventRound][voter] = target;
                    break;
            }
        }

        return game;
    }

    /// <summary>
    /// Rekonstruiše kompletnu igru iz svih događaja
    /// </summary>
    private async Task<OdigranaPartijaZaVracanje?> ReconstructGameAsync(Guid gameId)
    {
        try
        {
            // Prvo pročitaj osnovne informacije o igri (igrači, room_id)
            var gameHistoryBound = _getGameHistoryStatement!.Bind(gameId);
            var gameHistoryRowSet = await _session.ExecuteAsync(gameHistoryBound);
            var gameHistoryRow = gameHistoryRowSet.FirstOrDefault();

            if (gameHistoryRow == null)
                return null;

            var playersJson = gameHistoryRow.GetValue<string>("players");
            var roomId = gameHistoryRow.GetValue<string>("room_id");
            var endTime = gameHistoryRow.GetValue<DateTimeOffset>("end_time").DateTime;
            var players = JsonConvert.DeserializeObject<List<string>>(playersJson) ?? new List<string>();

            // Zatim učitaj sve događaje
            var bound = _getEventsFromTimeStatement!.Bind(gameId, DateTime.MinValue, DateTime.MaxValue);
            var rowSet = await _session.ExecuteAsync(bound);

            var game = new OdigranaPartijaZaVracanje
            {
                Id = gameId.ToString(),
                RoomId = roomId,
                Igraci = players,
                VremeKraja = endTime,
                CluoviPoRundi = new Dictionary<int, Dictionary<string, string>>(),
                GlasanjaPoRundi = new Dictionary<int, Dictionary<string, string>>(),
                Poruke = new List<Message>()
            };

            int maxRound = 0;

            foreach (var row in rowSet)
            {
                var eventType = row.GetValue<string>("event_type");
                var username = row.GetValue<string>("username");
                var eventTime = row.GetValue<DateTimeOffset>("event_time").DateTime;
                var eventRound = row.GetValue<int?>("event_round") ?? 0;
                if (eventRound <= 0) eventRound = 1;

                // Prati maksimalnu rundu
                if (eventRound > maxRound)
                    maxRound = eventRound;

                switch (eventType)
                {
                    case "message":
                        var content = row.GetValue<string>("content");
                        
                        game.Poruke.Add(new Message { Username = username, Content = content, Timestamp = eventTime });
                        break;

                    case "clue":
                        var clueContent = row.GetValue<string>("content");
                        if (!game.CluoviPoRundi.ContainsKey(eventRound))
                            game.CluoviPoRundi[eventRound] = new Dictionary<string, string>();
                        game.CluoviPoRundi[eventRound][username] = clueContent;
                        break;

                    case "vote":
                        var target = row.GetValue<string>("target");
                        var voter = row.GetValue<string>("voter");
                        if (!game.GlasanjaPoRundi.ContainsKey(eventRound))
                            game.GlasanjaPoRundi[eventRound] = new Dictionary<string, string>();
                        game.GlasanjaPoRundi[eventRound][voter] = target;
                        break;
                }
            }

            game.BrojRundi = maxRound;

            return game;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error reconstructing game: {ex.Message}");
            return null;
        }
    }
}