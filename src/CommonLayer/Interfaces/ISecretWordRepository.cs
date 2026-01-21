using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CommonLayer.Interfaces
{
    public interface ISecretWordRepository
    {
        Task<List<string>> GetAllWordsAsync();
        Task SeedWordsAsync();
    }
}
