using CommonLayer.DTOs;
using CommonLayer.Interfaces;
using Microsoft.AspNetCore.Mvc;
using MyApp.CommonLayer.Interfaces;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IHistoryRepository _historyRepository;

        public UserController(IUserService userService, IHistoryRepository historyRepository)
        {
            _userService = userService;
            _historyRepository = historyRepository;
        }

        [HttpGet("{userId}")]
        public IActionResult GetUserById(string userId)
        {
            var user = _userService.GetUserById(userId);
            if (user == null)
            {
                return NotFound();
            }
            return Ok(user);
        }

        [HttpGet("profile/{username}")]
        public IActionResult GetUserProfile(string username)
        {
            try
            {
                // Pozivamo metodu koju smo upravo ispravili u Repository-ju
                var userProfile = _userService.GetUserByName(username);

                if (userProfile == null)
                {
                    return NotFound(new { message = $"Operativac sa imenom '{username}' nije pronađen u bazi." });
                }

                return Ok(userProfile);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Greška pri dohvatanju profila ({username}): {ex.Message}");
                return StatusCode(500, new { message = "Sistemska greška pri učitavanju dosijea." });
            }
        }

        [HttpPost("create")]
        public IActionResult CreateUser([FromBody] CreateUserInput user)
        {
            _userService.CreateAsync(user);
            return Ok();
        }

        [HttpPut("incrementPlayedGames/{userId}")]
        public IActionResult IncrementPlayedGames(string userId)
        {
            _userService.IncrementPlayedGames(userId);
            return Ok();
        }

        [HttpPut("incrementWinsLikeCrewmate/{userId}")]
        public IActionResult IncrementWinsLikeCrewmate(string userId)
        {
            _userService.IncrementWinsLikeCrewmate(userId);
            return Ok();
        }

        [HttpPut("incrementWinsLikeImpostor/{userId}")]
        public IActionResult IncrementWinsLikeImpostor(string userId)
        {
            _userService.IncrementWinsLikeImpostor(userId);
            return Ok();
        }

        [HttpPut("addPoints/{userId}/{points}")]
        public IActionResult AddPoints(string userId, int points)
        {
            _userService.AddPoints(userId, points);
            return Ok();
        }

        [HttpGet("leaderboard")]
        public async Task<IActionResult> GetLeaderboard([FromQuery] string sortBy = "points")
        {
            try
            {
                var leaderboard = await _userService.GetLeaderboardAsync(sortBy);
                return Ok(leaderboard);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri učitavanju rang liste.");
            }
        }

        [HttpGet("usernameAlreadyExists/{username}")]
        public IActionResult UsernameAlreadyExist(string username)
        {
            var exists = _userService.UsernameAlreadyExist(username).Result;
            return Ok(exists);
        }

        [HttpGet("history/{username}")]
        public async Task<IActionResult> GetHistoryForUser(string username, [FromQuery] int count = 20, [FromQuery] int offset = 0)
        {
            var history = await _historyRepository.GetHistoryForUserAsync(username, count, offset);
            return Ok(history);
        }

        [HttpGet("history/{gameId}/next")]
        public async Task<IActionResult> GetNextAnyState(string gameId, [FromQuery] DateTime? lastTimestamp = null)
        {
            var (state, nextTime) = await _historyRepository.GetNextAnyStateAsync(gameId, lastTimestamp);
            return Ok(new { state, nextTime });
        }

        [HttpGet("history/{gameId}/next-significant")]
        public async Task<IActionResult> GetNextSignificantState(string gameId, [FromQuery] DateTime? lastTimestamp = null)
        {
            var (state, nextTime) = await _historyRepository.GetNextSignificantStateAsync(gameId, lastTimestamp);
            return Ok(new { state, nextTime });
        }

    }
}
