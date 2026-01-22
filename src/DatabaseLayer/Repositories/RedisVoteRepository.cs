using CommonLayer.Interfaces;
using CommonLayer.Models;
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

        public RedisVoteRepository(IConnectionMultiplexer redis)
        {
            _redisDb = redis.GetDatabase();
        }

        public async Task AddVoteAsync(string roomId, Vote vote)
        {
            string key = $"votes:{roomId}";
            string serializedVote = JsonSerializer.Serialize(vote);
            await _redisDb.ListRightPushAsync(key, serializedVote);
        }

        public async Task<List<Vote>> GetVotesAsync(string roomId)
        {
            string key = $"votes:{roomId}";
            var data = await _redisDb.ListRangeAsync(key);

            return data
                .Select(v => JsonSerializer.Deserialize<Vote>(v!))
                .Where(v => v != null)
                .ToList()!;
        }

        public async Task ClearVotesAsync(string roomId)
        {
            string key = $"votes:{roomId}";
            await _redisDb.KeyDeleteAsync(key);
        }
    }
}
