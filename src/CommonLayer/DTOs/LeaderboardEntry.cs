using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CommonLayer.DTOs
{
    public class LeaderboardEntry
    {
        public string Username { get; set; } = string.Empty;
        public long GamesPlayed { get; set; }
        public long WinsLikeCrewmate { get; set; }
        public long WinsLikeImpostor { get; set; }
        public long TotalScore { get; set; }
    }
}
