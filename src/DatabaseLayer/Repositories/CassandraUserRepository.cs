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

        private PreparedStatement? _getUserIdByUsernameStatement;

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

            // INICIJALIZACIJA NOVOG STATEMENTA:
            _getUserIdByUsernameStatement = _session.Prepare("SELECT user_id FROM user_by_username WHERE username = ?");
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

        public GetUserResponse? GetUserById(string userId)
        {
            var userRow = _session.Execute(_getUserByIdStatement!.Bind(userId)).FirstOrDefault();
            var statsRow = _session.Execute(_getUserStatsStatement!.Bind(userId)).FirstOrDefault();
            return MapRowsToUser(userRow, statsRow);
        }

        public GetUserResponse? GetUserByName(string userName)
        {
            var idRow = _session.Execute(_getUserIdByUsernameStatement!.Bind(userName)).FirstOrDefault();

            if (idRow == null) return null; 

            string userId = idRow.GetValue<string>("user_id");

            return GetUserById(userId);
        }

        public async Task CreateAsync(CreateUserInput user)
        {
            var batch = new BatchStatement();

            batch.Add(_createUserStatement!.Bind(user.UserId, user.Username, user.Email));
            batch.Add(_insertUserNameStatement!.Bind(user.Username, user.UserId));

            var initStats = _session.Prepare("UPDATE user_stats SET total_score = total_score + 0 WHERE user_id = ?");
            batch.Add(initStats.Bind(user.UserId));

            await _session.ExecuteAsync(batch);
        }

        public Task UpdateAsync(User user) => throw new NotImplementedException();

        public Task IncrementPlayedGames(string userId) => _session.ExecuteAsync(_incrementPlayedGamesStatement!.Bind(userId));

        public Task IncrementWinsLikeCrewmate(string userId) => _session.ExecuteAsync(_incrementWinsLikeCrewmateStatement!.Bind(userId));

        public Task IncrementWinsLikeImpostor(string userId) => _session.ExecuteAsync(_incrementWinsLikeImpostorStatement!.Bind(userId));

        public Task AddPoints(string userId, long points) => _session.ExecuteAsync(_addPointsStatement!.Bind(points, userId));

        public async Task<bool> UsernameAlreadyExist(string username)
        {
            var result = await _session.ExecuteAsync(_usernameAlreadyExistStatement!.Bind(username));
            return result.Any();
        }
    }
}