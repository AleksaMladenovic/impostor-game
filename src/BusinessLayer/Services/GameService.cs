using CommonLayer.Interfaces;
using CommonLayer.Models;
using MyApp.CommonLayer.Enums;
using MyApp.CommonLayer.Interfaces;
using MyApp.CommonLayer.Models;

namespace MyApp.BusinessLayer.Services;

public class GameService : IGameService
{
    private readonly IGameRoomRepository _gameRoomRepository;
    private readonly ISecretWordService _secretWordService;
    private readonly IUserService _userService;
    private readonly IChatRepository _chatRepository;
    private readonly IVoteRepository _voteRepository;
    private readonly IClueRepository _clueRepository;

    public GameService(IGameRoomRepository gameRoomRepository, ISecretWordService secretWordService, IChatRepository chatRepository,IClueRepository clueRepository,IUserService user,IVoteRepository voteRepository)
    {
        _gameRoomRepository = gameRoomRepository;
        _secretWordService = secretWordService;
        _chatRepository = chatRepository;
        _clueRepository = clueRepository;
        _userService = user;
        _voteRepository = voteRepository;
    }

    public async Task<GameRoom>? GetRoomAsync(string roomId)
    {
        return await _gameRoomRepository.GetByIdAsync(roomId);
    }

    public async Task StartGameAsync(string roomId, int maxNumberOfRounds, int durationPerUserInSeconds)
    {
        var room = await _gameRoomRepository.GetByIdAsync(roomId);
        if (room == null)
        {
            throw new Exception("Room not found");
        }

        room.NumberOfRounds = maxNumberOfRounds;
        room.SecondsPerTurn = durationPerUserInSeconds;
        room.State = GameState.InProgress;
        room.CurrentRound = 1;
        room.TurnsTakenInCurrentRound = 0;
        room.SecretWord = await _secretWordService.GetRandomSecretWordAsync();

        // Izaberi nasumičnog igrača za prvi potez
        var playerIds = room.Players.Keys.ToList();

        room.CurrentTurnPlayerId = playerIds[Random.Shared.Next(playerIds.Count)];
        room.CurrentTurnPlayerUsername = _userService.GetUserById(room.CurrentTurnPlayerId).Username;

        room.UserIdOfImpostor = playerIds[Random.Shared.Next(playerIds.Count)];
        room.UsernameOfImpostor= _userService.GetUserById(room.UserIdOfImpostor).Username;

        room.SubmittedClues.Clear();
        room.Votes.Clear();

        await _gameRoomRepository.SaveAsync(room);

    }

    public async Task SendMessageToRoomAsync(string roomId, Message message)
    {
        try
        {
            await _chatRepository.AddMessageToRoomAsync(roomId, message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error sending message to room: {ex.Message}");
            throw;
        }

    }


    public async Task<List<Message>> GetMessagesFromRoomAsync(string roomId)
    {
        try
        {
            return await _chatRepository.GetMessagesFromRoomAsync(roomId);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting messages from room: {ex.Message}");
            throw;
        }
    }

    public async Task SendClueToRoomAsync(string roomId, Clue clue)
    {
        try
        {
            await _clueRepository.AddClueToRoomAsync(roomId, clue);

        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error sending clue to room: {ex.Message}");
            throw;
        }
    }

    public async Task<List<Clue>> GetCluesFromRoomAsync(string roomId)
    {
        try
        {
            return await _clueRepository.GetCluesFromRoomAsync(roomId);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting clues from room: {ex.Message}");
            throw;
        }
    }

    public async Task<GameRoom?> AdvanceTurnAsync(string roomId)
    {
        var room = await _gameRoomRepository.GetByIdAsync(roomId);
        if (room == null || room.Players == null || room.Players.Count == 0)
            return null;

        var sortedPlayers = room.Players.Values.OrderBy(p => p.UserId).ToList();
        int currentIndex = sortedPlayers.FindIndex(p => p.UserId == room.CurrentTurnPlayerId);
        if (currentIndex == -1) currentIndex = 0;

        room.TurnsTakenInCurrentRound++;

        if (room.TurnsTakenInCurrentRound >= sortedPlayers.Count)
        {
            room.State = GameState.Voting; 
            room.TurnsTakenInCurrentRound = 0; 

        }
        else
        {
            int nextIndex = (currentIndex + 1) % sortedPlayers.Count;
            var nextPlayer = sortedPlayers[nextIndex];

            room.CurrentTurnPlayerId = nextPlayer.UserId;
            room.CurrentTurnPlayerUsername = nextPlayer.Username;
        }

        await _gameRoomRepository.SaveAsync(room);
        return room;
    }

    public async Task RegisterVoteAsync(string roomId, Vote vote)
    {
        await _voteRepository.AddVoteAsync(roomId, vote);

        var room = await _gameRoomRepository.GetByIdAsync(roomId);
        var allVotes = await _voteRepository.GetVotesAsync(roomId);

        if (room != null && allVotes.Count >= room.Players.Count)
        {
            var voteCounts = allVotes
                .GroupBy(v => v.TargetId)
                .Select(g => new { Id = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList();

            if (voteCounts.Count > 0 && voteCounts[0].Id != "skip")
            {
                bool isTie = voteCounts.Count > 1 && voteCounts[0].Count == voteCounts[1].Count;

                if (!isTie)
                {
                    var winner = voteCounts[0];
                    room.LastEjectedUserId = winner.Id;
                    room.LastEjectedUsername = allVotes.First(v => v.TargetId == winner.Id).TargetUsername;

                    if (room.LastEjectedUserId == room.UserIdOfImpostor)
                    {
                        room.IsGameOver = true;
                        room.State = GameState.GameFinished; 
                    }
                }
                else
                {
                    room.LastEjectedUsername = "Nerešeno"; 
                }
            }
            else
            {
                room.LastEjectedUsername = "Preskočeno"; 
            }

            
            if (!room.IsGameOver)
            {
                room.State = GameState.InProgress;
                room.CurrentRound++;
            }

            await _voteRepository.ClearVotesAsync(roomId);
            await _gameRoomRepository.SaveAsync(room);
        }
    }
}