using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cassandra;
using CommonLayer.Interfaces;
using CommonLayer.Models;

namespace DatabaseLayer.Repositories
{
    public class CassandraSecretWordRepository : ISecretWordRepository
    {
        private readonly ISession _session;

        private PreparedStatement? _getAllWordsStatement;
        private PreparedStatement? _insertWordStatement;
        private PreparedStatement? _countWordsStatement;

        public CassandraSecretWordRepository(ISession session)
        {
            _session = session;
            InitializePreparedStatements();
        }

        private void InitializePreparedStatements()
        {
            _getAllWordsStatement = _session.Prepare("SELECT word FROM secret_words");

            _insertWordStatement = _session.Prepare("INSERT INTO secret_words (word_id, word) VALUES (?, ?)");

            _countWordsStatement = _session.Prepare("SELECT count(*) FROM secret_words");
        }

        public async Task<List<string>> GetAllWordsAsync()
        {
            var boundStatement = _getAllWordsStatement!.Bind();
            var rowSet = await _session.ExecuteAsync(boundStatement);

            return rowSet.Select(row => row.GetValue<string>("word")).ToList();
        }

        public async Task SeedWordsAsync()
        {
            var boundCount = _countWordsStatement!.Bind();
            var countRowSet = await _session.ExecuteAsync(boundCount);
            var count = countRowSet.First().GetValue<long>(0);

            if (count > 0) return;

            string[] wordsToSeed = {
                "Pas", "Macka", "Lav", "Tigar", "Slon", "Zirafa", "Vuk", "Zmija", "Orao", "Ajkula",
                "Delfin", "Majmun", "Konj", "Krava", "Svinja", "Pingvin", "Sova", "Zec", "Medved", "Pauk",
                "Telefon", "Laptop", "Televizor", "Sat", "Kljuc", "Novcanik", "Knjiga", "Olovka", "Torba", "Kiseobran",
                "Cipele", "Majica", "Jakna", "Naocale", "Kapa", "Sto", "Stolica", "Krevet", "Vrata", "Prozor",
                "Cekic", "Srafciger", "Noz", "Kasika", "Viljuska", "Tanjir", "Casa", "Sveca", "Baterija", "Ogledalo",
                "Pica", "Pljeskavica", "Sarma", "Burek", "Cevapi", "Sladoled", "Cokolada", "Jabuka", "Banana", "Kafa",
                "Rakija", "Pivo", "Vino", "Mleko", "Hleb", "Jaje", "Sir", "Paradajz", "Krompir", "Luk",
                "Skola", "Bolnica", "Crkva", "Kafana", "Bioskop", "Park", "Sumica", "Planina", "Reka", "More",
                "Plaza", "Aerodrom", "Most", "Zgrada", "Selo", "Automobil", "Avion", "Brod", "Voz", "Bicikl",
                "Svemir", "Mesec", "Sunce", "Zvezda", "Kisa", "Sneg", "Vetar", "Vatra", "Voda", "Zemlja"
            };

            var batch = new BatchStatement();

            foreach (var word in wordsToSeed)
            {
                var boundInsert = _insertWordStatement!.Bind(
                    Guid.NewGuid().ToString(), 
                    word                        
                );
                batch.Add(boundInsert);
            }

            await _session.ExecuteAsync(batch);
        }
    }
}