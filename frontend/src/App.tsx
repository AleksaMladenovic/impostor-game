import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import StartPage from "./components/StartPage"; // Putanja do tvog novog Home fajla
import Login from "./components/Login"; // Tvoja login stranica
import Register from "./components/Register"; // Tvoja register stranica
import HomePage from "./components/HomePage"; // Ono što si mi malopre pokazao (sa kreriranjem sobe)
import ProfilePage from "./components/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import VerifyEmail from "./components/VerifyEmail";
import Lobby from "./components/Lobby";
import Game from "./components/Game";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Glavna stranica (ona sa animacijom) */}
          <Route path="/" element={<StartPage />} />
          
          {/* Ostale stranice */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/home" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/lobby/:roomId" element={
            <ProtectedRoute>
              <Lobby />
            </ProtectedRoute>
          } />
            <Route path="/profile/:username" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/game/:roomId" element={
            <ProtectedRoute>
              <Game />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;