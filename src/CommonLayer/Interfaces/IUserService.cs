using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CommonLayer.DTOs;
using MyApp.CommonLayer.Models;

namespace CommonLayer.Interfaces;


public interface IUserService
{
    GetUserResponse? GetUserById(string userId);
    GetUserResponse? GetUserByName(string userName);
    Task CreateAsync(CreateUserInput user);
    Task<bool> UsernameAlreadyExist(string username);
    Task UpdateAsync(User user);
    Task IncrementPlayedGames(string userId);
    Task IncrementWinsLikeCrewmate(string userId);
    Task IncrementWinsLikeImpostor(string userId);
    Task AddPoints(string userId, long points);
    Task<List<LeaderboardEntry>> GetLeaderboardAsync();
  
    Task<List<LeaderboardEntry>> GetLeaderboardAsync(string sortBy);
    
}
