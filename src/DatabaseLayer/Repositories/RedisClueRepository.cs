using CommonLayer.Interfaces;
using CommonLayer.Models;
using StackExchange.Redis;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DatabaseLayer.Repositories
{
    public class RedisClueRepository : IClueRepository
    {
        private readonly IDatabase _redisDb;

        public RedisClueRepository(IConnectionMultiplexer redis)
        {
            _redisDb = redis.GetDatabase();
        }

        public async Task AddClueToRoomAsync(string roomId, Clue clue)
        {
            try
            {
                string key = $"clues:{roomId}";
                string history_key = $"game:{roomId}:history";

                string serializedClue = System.Text.Json.JsonSerializer.Serialize(clue);
                await _redisDb.ListRightPushAsync(key, serializedClue);

                var currentRoundValue = await _redisDb.StringGetAsync($"game:room:{roomId}:currentRound");
                int currentRound = currentRoundValue.IsNullOrEmpty ? 0 : (int)currentRoundValue;

                await _redisDb.ListRightPushAsync(
                    history_key,
                    System.Text.Json.JsonSerializer.Serialize(new {
                        type = "clue",
                        username = clue.Username,
                        content = clue.ClueWord,
                        round = currentRound,
                        timestamp = DateTime.UtcNow
                    })
                );
                
            }
            catch(Exception ex) 
            {
                Console.WriteLine($"Error serializing clue: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Clue>> GetCluesFromRoomAsync(string roomId)
        {
            try
            {
                string key = $"clues:{roomId}";
                var clueRedis = await _redisDb.ListRangeAsync(key);
                var clues= clueRedis.Select(clue=> System.Text.Json.JsonSerializer.Deserialize<Clue>(clue))
                                    .Where(clue=>clue!=null)
                                    .ToList();
                return clues;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deserializing clues: {ex.Message}");
                throw;
            }
        }
    }
}
