using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CommonLayer.Models
{
    public class Vote
    {
        public required string RoomId { get; set; }
        public int Round { get; set; }
        public required string Username { get; set; }
        public string? TargetUsername { get; set; }
    }
}
