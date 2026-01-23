using CommonLayer.Interfaces;
using CommonLayer.Models;
using MyApp.CommonLayer.DTOs;
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

    public async Task StartGameAsync(string roomId, int maxNumberOfRounds, int durationPerUserInSeconds, List<string> usernames)
    {
        GameStatesInSeconds.Values[ (int)GameState.InProgress ] = durationPerUserInSeconds;
        string secretWord = await _secretWordService.GetRandomSecretWordAsync();
        await _gameRoomRepository.SetUsers(roomId, usernames);
        await _gameRoomRepository.SetStartingSettings(roomId,
            maxNumberOfRounds, 
            durationPerUserInSeconds, 
            usernames[Random.Shared.Next(usernames.Count)], 
            usernames[Random.Shared.Next(usernames.Count)],
            secretWord
            );
        await _gameRoomRepository.SetNewState(roomId, GameState.ShowSecret, durationPerUserInSeconds);
    }
 
    public async Task<ReturnState> GetStateAsync(string roomId)
    {
        var state = await _gameRoomRepository.GetCurrentState(roomId);
        switch(state.State)
        {
            case GameState.ShowSecret:
                state.ShowSecretStates = await _gameRoomRepository.GetShowSecretStateDetails(roomId);
                break;
            case GameState.InProgress:
                state.InProgressStates = new InProgressStates
                {
                    CurrentPlayer = await _gameRoomRepository.GetCurrentPlayer(roomId),
                    RoundNumber = await _gameRoomRepository.GetCurrentRound(roomId),
                    MaxRounds = await _gameRoomRepository.GetMaxNumberOfRounds(roomId)
                };
                break;
            case GameState.Voting:
                state.VotingStates = new VotingStates();
                break;
            case GameState.GameFinished:
                break;
        }
        return state;
    }

    public async Task SetNextStateAsync(string roomId)
    {
        var currentState = await _gameRoomRepository.GetCurrentState(roomId);
        GameState nextState;
        switch (currentState.State)
        {
            case GameState.ShowSecret:
                nextState = GameState.InProgress;
                break;
            case GameState.InProgress:
                var currentPlayer = await _gameRoomRepository.GetCurrentPlayer(roomId);
                var users = await _gameRoomRepository.GetUsers(roomId);
                int currentIndex = users.FindIndex(u => u == currentPlayer);
                int nextIndex = (currentIndex + 1) % users.Count;
                var nextPlayer = users[nextIndex];
                var firstPlayer = await _gameRoomRepository.GetFirstPlayer(roomId);
                if(nextPlayer ==  firstPlayer)
                nextState = GameState.Voting;
                else nextState = GameState.InProgress;
                await _gameRoomRepository.UpdateCurrentPlayer(roomId, nextPlayer);
                break;
            case GameState.Voting:
                var currentRound = await _gameRoomRepository.GetCurrentRound(roomId);
                var maxRounds = await _gameRoomRepository.GetMaxNumberOfRounds(roomId);
                if (currentRound >= maxRounds)
                    nextState = GameState.GameFinished;
                else
                {
                    await _gameRoomRepository.IncrementAndGetCurrentRound(roomId);
                    nextState = GameState.InProgress;
                }
                break;
            default:
                nextState = GameState.InProgress;
                break;
        }
        if(nextState == GameState.GameFinished)
        {
            await _gameRoomRepository.SetNewState(roomId, nextState, 0);    
            return;
        }else if(nextState == GameState.InProgress)
        {
            await _gameRoomRepository.SetNewState(roomId, nextState, await _gameRoomRepository.GetDurationPerUserInSeconds(roomId));    
            return;
        }else
        {
            await _gameRoomRepository.SetNewState(roomId, nextState, GameStatesInSeconds.Values[(int)nextState]);    
            return;
        }
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