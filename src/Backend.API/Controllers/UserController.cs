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

        public UserController(IUserService userService)
        {
            _userService = userService;
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

        [HttpGet("usernameAlreadyExists/{username}")]
        public IActionResult UsernameAlreadyExist(string username)
        {
            var exists = _userService.UsernameAlreadyExist(username).Result;
            return Ok(exists);
        }
    }
}
