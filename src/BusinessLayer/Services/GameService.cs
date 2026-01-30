using CommonLayer.Interfaces;
using CommonLayer.Models;
using MyApp.CommonLayer.DTOs;
using MyApp.CommonLayer.Enums;
using MyApp.CommonLayer.Interfaces;
using MyApp.CommonLayer.Models;
using Microsoft.AspNetCore.SignalR;

namespace MyApp.BusinessLayer.Services;

public class GameService : IGameService
{
    private readonly IGameRoomRepository _gameRoomRepository;
    private readonly ISecretWordService _secretWordService;
    private readonly IUserService _userService;
    private readonly IChatRepository _chatRepository;
    private readonly IVoteRepository _voteRepository;
    private readonly IClueRepository _clueRepository;
    private readonly IHistoryRepository _historyRepository;
    public GameService(IGameRoomRepository gameRoomRepository, ISecretWordService secretWordService, IChatRepository chatRepository,IClueRepository clueRepository,IUserService user,IVoteRepository voteRepository, IHistoryRepository historyRepository)
    {
        _gameRoomRepository = gameRoomRepository;
        _secretWordService = secretWordService;
        _chatRepository = chatRepository;
        _clueRepository = clueRepository;
        _userService = user;
        _voteRepository = voteRepository;
        _historyRepository = historyRepository;
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
            case GameState.VoteResult: // NOVO
                var ejected = await _gameRoomRepository.GetEdjectedPlayer(roomId);
                var impostor = await _gameRoomRepository.GetImpostorUsername(roomId);
                state.VoteResultStates = new VoteResultStates
                {
                    EjectedUsername = ejected,
                    WasImpostor = ejected == impostor
                };
                break;
            case GameState.GameFinished:
                state.GameFinishedStates = new GameFinishedStates();
                var Ejected = await _gameRoomRepository.GetEdjectedPlayer(roomId);
                var targetImpostor = await _gameRoomRepository.GetImpostorUsername(roomId);
                //TODO proveri da li ovo radi i bez await
                await SaveGameHistory(roomId);
                state.GameFinishedStates.ImpostorWon = (Ejected != targetImpostor);
                break;
        }
        return state;
    }

    public async Task SetNextStateAsync(string roomId)
    {
        var currentState = await _gameRoomRepository.GetCurrentState(roomId);
        GameState nextState;
        int nextStateDuration = 0;

        switch (currentState.State)
        {
            case GameState.ShowSecret:
                nextState = GameState.InProgress;
                nextStateDuration = await _gameRoomRepository.GetDurationPerUserInSeconds(roomId);
                break;

            case GameState.InProgress:
                var currentPlayer = await _gameRoomRepository.GetCurrentPlayer(roomId);
                var users = await _gameRoomRepository.GetUsers(roomId);
                int currentIndex = users.FindIndex(u => u == currentPlayer);
                int nextIndex = (currentIndex + 1) % users.Count;
                var nextPlayer = users[nextIndex];
                var firstPlayer = await _gameRoomRepository.GetFirstPlayer(roomId);

                if (nextPlayer == firstPlayer)
                    nextState = GameState.Voting;
                else
                    nextState = GameState.InProgress;

                await _gameRoomRepository.UpdateCurrentPlayer(roomId, nextPlayer);
                nextStateDuration = (nextState == GameState.Voting)
                    ? GameStatesInSeconds.Values[(int)GameState.Voting]
                    : await _gameRoomRepository.GetDurationPerUserInSeconds(roomId);
                break;

            case GameState.Voting:
                var currentRound = await _gameRoomRepository.GetCurrentRound(roomId);
                var votes = await _voteRepository.GetVotesAsync(roomId, currentRound);
                var totalPlayers = await _gameRoomRepository.NumberOfUsers(roomId);

                var playerVotes = votes.Where(v => !string.IsNullOrEmpty(v.TargetUsername) && v.TargetUsername != "skip")
                                       .GroupBy(v => v.TargetUsername)
                                       .ToDictionary(g => g.Key, g => g.Count());

                string ejectedPlayer = "skip";

                if (playerVotes.Count > 0)
                {
                    int maxVotes = playerVotes.Values.Max();
                    var topCandidates = playerVotes.Where(kv => kv.Value == maxVotes)
                                                   .Select(kv => kv.Key)
                                                   .ToList();

                    // po tvojoj logici: mora da bude jedinstven pobednik + >= polovine
                    if (topCandidates.Count == 1 && maxVotes >= (totalPlayers / 2.0))
                        ejectedPlayer = topCandidates[0];
                }

                await _gameRoomRepository.SetEdjectedPlayer(roomId, ejectedPlayer);

                nextState = GameState.VoteResult;
                nextStateDuration = 5;
                break;

                case GameState.VoteResult:
                {
                    var lastEjected = await _gameRoomRepository.GetEdjectedPlayer(roomId); 
                    var round = await _gameRoomRepository.GetCurrentRound(roomId);
                    var maxR = await _gameRoomRepository.GetMaxNumberOfRounds(roomId);

                    bool someoneEjected = !string.IsNullOrEmpty(lastEjected) && lastEjected != "skip";

                    if (someoneEjected)
                    {
                        nextState = GameState.GameFinished;
                        nextStateDuration = 0;
                        break;
                    }

                    if (round >= maxR)
                    {
                        nextState = GameState.GameFinished;
                        nextStateDuration = 0;
                        break;
                    }

                    await _gameRoomRepository.IncrementAndGetCurrentRound(roomId);

                    var firstPlayers = await _gameRoomRepository.GetFirstPlayer(roomId);
                    await _gameRoomRepository.UpdateCurrentPlayer(roomId, firstPlayers);

                    nextState = GameState.InProgress;
                    nextStateDuration = await _gameRoomRepository.GetDurationPerUserInSeconds(roomId);
                    break;
                }

            default:
                nextState = GameState.InProgress;
                break;
        }

        await _gameRoomRepository.SetNewState(roomId, nextState, nextStateDuration);
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

    public async Task RegisterVoteAsync(Vote vote)
    {
        await _voteRepository.AddVoteAsync( vote);
    }

    public async Task SaveGameHistory(string roomId)
    {
        var listaEventa = await _gameRoomRepository.GetHistory(roomId);
        var listaIgraca = await _gameRoomRepository.GetUsers(roomId);
        await _historyRepository.SaveGameAsync(listaIgraca,roomId, listaEventa);
    }
}

