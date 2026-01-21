using Microsoft.AspNetCore.Mvc;
using CommonLayer.Interfaces;

namespace Backend.controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SecretWordsController : ControllerBase
    {
        private readonly ISecretWordRepository _secretWordRepository;

        public SecretWordsController(ISecretWordRepository secretWordRepository)
        {
            _secretWordRepository = secretWordRepository;
        }

        [HttpPost("seed")]
        public async Task<IActionResult> SeedWords()
        {
            try
            {
                await _secretWordRepository.SeedWordsAsync();
                return Ok(new { message = "Proces punjenja baze rečima je završen!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Greška pri punjenju baze: " + ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var words = await _secretWordRepository.GetAllWordsAsync();
                return Ok(new { count = words.Count, words = words });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Greška pri čitanju iz baze: " + ex.Message });
            }
        }
    }
}