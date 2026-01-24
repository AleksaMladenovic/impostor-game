using CommonLayer.Interfaces;
using CommonLayer.Models;
using MyApp.CommonLayer.Interfaces;
using StackExchange.Redis;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace DatabaseLayer.Repositories
{
    public class RedisVoteRepository : IVoteRepository
    {
        private readonly IDatabase _redisDb;

        public RedisVoteRepository(IConnectionMultiplexer redis, IGameRoomRepository gameRoomRepository)
        {
            _redisDb = redis.GetDatabase();
        }

        public async Task AddVoteAsync(Vote vote)
        {
            string key = $"votes:{vote.RoomId}:{vote.Round}";
            string numOfRoundsKey = $"votemaxround:{vote.RoomId}";
            var existingMaxRoundRedis = await _redisDb.StringGetAsync(numOfRoundsKey);
            int existingMaxRound = existingMaxRoundRedis.IsNullOrEmpty ? 0 : (int)existingMaxRoundRedis;
            if (vote.Round > existingMaxRound || existingMaxRound == 0)
            {
                await _redisDb.StringSetAsync(numOfRoundsKey, vote.Round);
            } 
            await _redisDb.HashSetAsync(key, vote.Username, vote.TargetUsername==null ? "" : vote.TargetUsername);
        }

        public async Task ClearVotesAsync(string roomId)
        {
            string numOfRoundsKey = $"votemaxround:{roomId}";
            var existingMaxRoundRedis = await _redisDb.StringGetAsync(numOfRoundsKey);
            int existingMaxRound = existingMaxRoundRedis.IsNullOrEmpty ? 0 : (int)existingMaxRoundRedis;
            for (int round = 1; round <= existingMaxRound; round++)
            {
                string key = $"votes:{roomId}:{round}";
                await _redisDb.KeyDeleteAsync(key);
            }
            await _redisDb.KeyDeleteAsync(numOfRoundsKey);
        }

        public async Task<List<Vote>> GetAllVotesAsync(string roomId)
        {
            string numOfRoundsKey = $"votemaxround:{roomId}";
            var existingMaxRoundRedis = await _redisDb.StringGetAsync(numOfRoundsKey);
            int existingMaxRound = existingMaxRoundRedis.IsNullOrEmpty ? 0 : (int)existingMaxRoundRedis;
            List<Vote> allVotes = new List<Vote>();
            for (int round = 1; round <= existingMaxRound; round++)
            {
                string key = $"votes:{roomId}:{round}";
                var votesHash = await _redisDb.HashGetAllAsync(key);
                var votes = votesHash.Select(v => new Vote
                {
                    RoomId = roomId,
                    Round = round,
                    Username = v.Name,
                    TargetUsername = string.IsNullOrEmpty(v.Value) ? "" : v.Value
                }).ToList();
                allVotes.AddRange(votes);
            }
            return allVotes;
        }

        public Task<List<Vote>> GetVotesAsync(string roomId, int round)
        {
            string key = $"votes:{roomId}:{round}";
            return _redisDb.HashGetAllAsync(key).ContinueWith(t =>
            {
                var votesHash = t.Result;
                return votesHash.Select(v => new Vote
                {
                    RoomId = roomId,
                    Round = round,
                    Username = v.Name,
                    TargetUsername = string.IsNullOrEmpty(v.Value) ? "" : v.Value
                }).ToList();
            });
        }
    }
}
