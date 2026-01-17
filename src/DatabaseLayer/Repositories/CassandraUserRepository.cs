using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Cassandra;
using CommonLayer.DTOs;
using CommonLayer.Interfaces;
using MyApp.CommonLayer.Models;

namespace DatabaseLayer.Repositories
{
    public class CassandraUserRepository : IUserService
    {
        private readonly ISession _session;

        private PreparedStatement? _getUserByIdStatement;
        private PreparedStatement? _getUserStatsStatement;
        private PreparedStatement? _createUserStatement;
        private PreparedStatement? _insertUserNameStatement;
        private PreparedStatement? _usernameAlreadyExistStatement;
        private PreparedStatement? _incrementPlayedGamesStatement;
        private PreparedStatement? _incrementWinsLikeCrewmateStatement;
        private PreparedStatement? _incrementWinsLikeImpostorStatement;
        private PreparedStatement? _addPointsStatement;

        public CassandraUserRepository(ISession session)
        {
            _session = session;
            InitializePreparedStatements();
        }

        private void InitializePreparedStatements()
        {
            _getUserByIdStatement = _session.Prepare("SELECT user_id, username, email " +
                "FROM users WHERE user_id = ?");

            _getUserStatsStatement = _session.Prepare("SELECT user_id, games_played, wins_as_crewmate, wins_as_impostor, total_score " +
                "FROM user_stats WHERE user_id = ?");

            _createUserStatement = _session.Prepare("INSERT INTO users (user_id, username, email) " +
                "VALUES (?, ?, ?)");


            _incrementPlayedGamesStatement = _session.Prepare("UPDATE user_stats SET games_played = games_played + 1 WHERE user_id = ?");

            _incrementWinsLikeCrewmateStatement = _session.Prepare("UPDATE user_stats SET wins_as_crewmate = wins_as_crewmate + 1 WHERE user_id = ?");

            _incrementWinsLikeImpostorStatement = _session.Prepare("UPDATE user_stats SET wins_as_impostor = wins_as_impostor + 1 WHERE user_id = ?");

            _addPointsStatement = _session.Prepare("UPDATE user_stats SET total_score = total_score + ? WHERE user_id = ?");

            _insertUserNameStatement = _session.Prepare("INSERT INTO user_by_username (username, user_id) VALUES (?, ?)");

            _usernameAlreadyExistStatement = _session.Prepare("SELECT username FROM user_by_username WHERE username = ?");

        }

       

        private GetUserResponse? MapRowsToUser(Row? userRow, Row? statsRow)
        {
            if (userRow == null) return null;
            return new GetUserResponse
            {
                UserId = userRow.GetValue<string>("user_id"),
                Username = userRow.GetValue<string>("username"),
                Email = userRow.GetValue<string>("email"),
                GamesPlayed = statsRow?.GetValue<long?>("games_played") ?? 0,
                WinsLikeCrewmate = statsRow?.GetValue<long?>("wins_as_crewmate") ?? 0,
                WinsLikeImpostor = statsRow?.GetValue<long?>("wins_as_impostor") ?? 0,
                TotalScore = statsRow?.GetValue<long?>("total_score") ?? 0
            };
        }

        public Task CreateAsync(CreateUserInput user)
        {
            var batch = new BatchStatement();
            var userStatement = _createUserStatement!.Bind(
                user.UserId,
                user.Username,
                user.Email);

            var userByUsername = _insertUserNameStatement!.Bind(
                user.Username,
                user.UserId);

            batch.Add(userStatement);
            batch.Add(userByUsername);

            return _session.ExecuteAsync(batch);
        }

        public GetUserResponse? GetUserById(string userId)
        {
            var boundStatement = _getUserByIdStatement!.Bind(userId);
            var userRow = _session.Execute(boundStatement);
            var statsRow = _session.Execute(_getUserStatsStatement!.Bind(userId));
            return MapRowsToUser(userRow.FirstOrDefault(), statsRow.FirstOrDefault());
        }

        public Task UpdateAsync(User user)
        {
            //var boundStatement = _updateUserStatement!.Bind(
            //    user.Username,
            //    user.Email,
            //    user.GamesPlayed,
            //    user.WinsLikeCrewmate,
            //    user.WinsLikeImpostor,
            //    user.TotalScore,
            //    user.UserId);

            //return _session.ExecuteAsync(boundStatement);
            throw new NotImplementedException("Nije implementiran update jos uvek");
        }

        public Task IncrementPlayedGames(string userId)
        {
            var boundStatement = _incrementPlayedGamesStatement!.Bind(userId);
            return _session.ExecuteAsync(boundStatement);
        }

        public Task IncrementWinsLikeCrewmate(string userId)
        {
            var boundStatement = _incrementWinsLikeCrewmateStatement!.Bind(userId);
            return _session.ExecuteAsync(boundStatement);
        }

        public Task IncrementWinsLikeImpostor(string userId)
        {
            var boundStatement = _incrementWinsLikeImpostorStatement!.Bind(userId);
            return _session.ExecuteAsync(boundStatement);
        }

        public Task AddPoints(string userId, long points)
        {
            var boundStatement = _addPointsStatement!.Bind(points, userId);
            return _session.ExecuteAsync(boundStatement);
        }

        public Task<bool> UsernameAlreadyExist(string username)
        {
            var boundStatement = _usernameAlreadyExistStatement!.Bind(username);
            var result = _session.Execute(boundStatement);
            return Task.FromResult(result.Any());
        }
    }
}
