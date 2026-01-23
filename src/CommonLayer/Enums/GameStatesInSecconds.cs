namespace MyApp.CommonLayer.Enums
{
    public static class GameStatesInSeconds
    {
        public static int[] Values = new int[]
        {
            0,    // Lobby
            60,   // InProgress
            30,   // Voting
            15,   // RoundFinished
            0     // GameFinished
        };
    }
}
