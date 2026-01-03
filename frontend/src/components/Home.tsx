import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
    const navigate = useNavigate();
    const { user, loggedUser, login, logout } = useAuth();
    const handleLoginClick = () => {
        navigate("/login");
    };

    const handleRegisterClick = () => {
        navigate("/register");
    };

    const handleLogoutClick = () => {
        logout();
    };

    return (
        <div>
            {loggedUser() ? (
                <>
                    <p>Welcome, {user?.email}</p>
                    <button className="btn btn-primary" onClick={handleLogoutClick}>Logout</button>
                </>
            ) : (
                <>
                    <button className="btn btn-primary" onClick={handleLoginClick}>Login</button>
                    <button className="btn btn-secondary" onClick={handleRegisterClick}>Register</button>
                </>
            )}

        </div>
    )
}

export default Home;