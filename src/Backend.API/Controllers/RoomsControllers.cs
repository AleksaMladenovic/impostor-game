
using Microsoft.AspNetCore.Mvc;
using MyApp.CommonLayer.DTOs;
using MyApp.CommonLayer.Interfaces;

namespace MyApp.BackendApi.Controllers;
[ApiController]
[Route("api/[controller]")]
public class RoomsController : ControllerBase
{
    private readonly ILobbyService _lobbyService;

    public RoomsController(ILobbyService lobbyService)
    {
        _lobbyService = lobbyService;
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateRoom()
    {
        var room = await _lobbyService.CreateRoomAsync();
        var response = new CreateRoomResponse { RoomId = room };
        return Ok(response);
    }
}