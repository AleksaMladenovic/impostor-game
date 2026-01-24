using CommonLayer.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CommonLayer.Interfaces
{
    public interface IVoteRepository
    {
        Task AddVoteAsync(Vote vote);
        Task<List<Vote>> GetAllVotesAsync(string roomId);
        Task<List<Vote>> GetVotesAsync(string roomId, int round);
        Task ClearVotesAsync(string roomId);
    }
}
