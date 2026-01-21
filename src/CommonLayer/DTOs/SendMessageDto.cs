namespace MyApp.CommonLayer.DTOs;

public class SendMessageDto
{
    public required string UserId { get; set; }
    public required string Username { get; set; }
    public required string Content { get; set; }
    public required DateTime Timestamp { get; set; }
}